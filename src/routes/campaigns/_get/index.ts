/** OPENAPI-CLASS : get-campaigns */

import UserRoute from "@src/features/routes/UserRoute";
import * as db from "@src/features/db";
class RouteItem extends UserRoute<{
  response: StoplightOperations["get-campaigns"]["responses"]["200"]["content"]["application/json"];
}> {
  private accessibleCampaigns: true | number[] = [];
  protected async init() {
    if (this.configuration.request.user.permission.admin?.appq_campaign) {
      this.accessibleCampaigns =
        this.configuration.request.user.permission.admin?.appq_campaign;
    }
  }
  protected async filter() {
    if (
      this.accessibleCampaigns !== true &&
      this.accessibleCampaigns.length === 0
    ) {
      this.setError(
        403,
        new Error("You are not authorized to do this") as OpenapiError
      );
      return false;
    }
    return true;
  }
  protected async prepare() {
    try {
      this.setSuccess(200, await this.getCampaigns());
    } catch (e) {
      const error = e as OpenapiError;
      this.setError(error.status_code || 500, error);
    }
  }

  private async getCampaigns() {
    let result: { id: number; name: string }[] = [];
    if (this.accessibleCampaigns === true) {
      result = await db.query(
        "SELECT id, title as name FROM wp_appq_evd_campaign"
      );
    } else {
      result = await db.query(
        `SELECT id, title as name 
          FROM wp_appq_evd_campaign 
          WHERE id IN (${this.accessibleCampaigns.join(",")})`
      );
    }
    return result;
  }
}

export default RouteItem;
