/** OPENAPI-CLASS: get-campaigns-owners */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

export default class Route extends UserRoute<{
  response: StoplightOperations["get-campaigns-owners"]["responses"]["200"]["content"]["application/json"];
}> {
  protected async filter() {
    if (!(await super.filter())) return false;
    if (!this.campaignOlps) {
      this.setError(
        403,
        new OpenapiError("You don't have access to any campaign.")
      );
      return false;
    }
    return true;
  }

  protected async prepare(): Promise<void> {
    let query = tryber.tables.WpAppqEvdCampaign.do()
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.id",
        "wp_appq_evd_campaign.pm_id"
      )
      .select(
        tryber.ref("id").withSchema("wp_appq_evd_profile"),
        tryber.ref("name").withSchema("wp_appq_evd_profile"),
        tryber.ref("surname").withSchema("wp_appq_evd_profile")
      )
      .where("wp_appq_evd_profile.name", "<>", "Deleted User")
      .groupBy("wp_appq_evd_profile.id");
    if (Array.isArray(this.campaignOlps)) {
      query = query.whereIn("wp_appq_evd_campaign.id", this.campaignOlps);
    }

    const result = await query;
    this.setSuccess(200, result);
  }
}
