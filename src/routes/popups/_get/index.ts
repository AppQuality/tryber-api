/** OPENAPI-CLASS: get-popups */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

type ProfileType =
  | "italian"
  | "non-italian"
  | "all"
  | "logged-in-year"
  | "not-logged-in-year";
export default class Route extends UserRoute<{
  response: StoplightOperations["get-popups"]["responses"]["200"]["content"]["application/json"];
  query: StoplightOperations["get-popups"]["parameters"]["query"];
}> {
  private limit: number | undefined;
  private start: number | undefined;

  constructor(configuration: RouteClassConfiguration) {
    super({ ...configuration, element: "popups" });
    this.setId(0);

    const query = this.getQuery();
    if (query.limit) {
      this.limit = parseInt(query.limit as unknown as string);
      if (query.start) {
        this.start = parseInt(query.start as unknown as string);
      }
    }
  }

  protected async filter() {
    if (!this.hasAccessToPopups() && this.isNotAdmin()) {
      this.setError(403, new OpenapiError("You cannot list popups"));
      return false;
    }
    return true;
  }

  protected async prepare() {
    let query = tryber.tables.WpAppqPopups.do().select().where("is_auto", 0);

    if (this.limit) query = query.limit(this.limit);
    if (this.start) query = query.offset(this.start);

    const rows = await query;
    if (!rows.length) {
      return this.setError(404, new OpenapiError("No popups found"));
    }

    this.setSuccess(200, this.mapPopups(rows));
  }

  protected hasAccessToPopups() {
    return this.configuration.request.user.permission?.admin
      ?.appq_message_center;
  }

  protected mapPopups(
    popups: {
      id: number;
      title: string;
      content: string;
      is_once: number;
      targets: string;
      extras: string;
      is_auto: number;
    }[]
  ) {
    return popups.map((popup) => {
      let currentProfiles: number[] | ProfileType = [];
      if (popup.targets) {
        if (popup.targets == "list") {
          currentProfiles = [];
          if (popup.extras) {
            const profiles = popup.extras.split(",").map((id) => parseInt(id));
            if (profiles) currentProfiles = profiles;
          }
        } else {
          currentProfiles = popup.targets as ProfileType;
        }
      }
      return {
        id: popup.id,
        title: popup.title,
        content: popup.content,
        once: popup.is_once === 1,
        profiles: currentProfiles,
      };
    });
  }
}
