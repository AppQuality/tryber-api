/** OPENAPI-CLASS: get-users-by-role-role */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";
import PHPUnserialize from "php-unserialize";

export default class Route extends UserRoute<{
  response: StoplightOperations["get-users-by-role-role"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-users-by-role-role"]["parameters"]["path"];
}> {
  private accessibleCampaigns: true | number[] = this.campaignOlps
    ? this.campaignOlps
    : [];
  private roleName: string;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    const { role } = this.getParameters();
    this.roleName = role;
  }

  protected async filter() {
    if ((await super.filter()) === false) return false;
    if (this.doesNotHaveAccessToCampaigns()) {
      this.setError(403, new OpenapiError("You are not authorized to do this"));
      return false;
    }
    return true;
  }

  private doesNotHaveAccessToCampaigns() {
    return this.accessibleCampaigns !== true;
  }

  protected async prepare() {
    const users = await tryber.tables.WpUsermeta.do()
      .select("id", "name", "surname", "meta_value")
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.wp_user_id",
        "wp_usermeta.user_id"
      )
      .where({
        meta_key: "wp_capabilities",
      })
      .whereLike("meta_value", `%${this.roleName}%`);

    const results = users
      .filter((user) => {
        const value = PHPUnserialize.unserialize(user.meta_value);
        if (!value) return false;
        if (typeof value !== "object") return false;

        return Object.keys(value).includes(this.roleName);
      })
      .map((user) => {
        return {
          id: user.id,
          name: user.name,
          surname: user.surname,
        };
      });

    this.setSuccess(200, {
      results,
    });
  }
}
