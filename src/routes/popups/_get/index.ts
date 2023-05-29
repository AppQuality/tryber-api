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
}> {
  private popups: {
    id: number;
    title: string;
    content: string;
    is_once: number;
    targets: string;
    extras: string;
    is_auto: number;
  }[] = [];
  constructor(configuration: RouteClassConfiguration) {
    super({ ...configuration, element: "popups" });
    this.setId(0);
  }

  protected async filter(): Promise<boolean> {
    if (!this.hasCapability("appq_message_center") && this.isNotAdmin()) {
      this.setError(403, new OpenapiError("You cannot list popups"));
      return false;
    }
    return true;
  }

  protected async prepare(): Promise<void> {
    const params =
      this.getQuery() as StoplightOperations["get-popups"]["parameters"]["query"];

    try {
      let query = tryber.tables.WpAppqPopups.do().select().where("is_auto", 0);

      if (params.limit && typeof params.limit == "string") {
        query = query.limit(parseInt(params.limit));
        if (params.start && typeof params.start == "string") {
          query = query.offset(parseInt(params.start));
        }
      }

      const rows = await query;
      if (!rows.length) {
        return this.setError(404, new OpenapiError("No popups found"));
      }
      this.popups = rows;

      this.setSuccess(200, this.mapPopups());
    } catch (error) {
      if (process.env && process.env.DEBUG) {
        console.error(error);
      }
      return this.setError(
        400,
        new OpenapiError(
          "Missing parameters: " + (error as OpenapiError).message
        )
      );
    }
  }
  protected isNotAdmin() {
    if (this.configuration.request.user.role !== "administrator") return true;
    return false;
  }

  protected mapPopups() {
    return this.popups.map((popup) => {
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
