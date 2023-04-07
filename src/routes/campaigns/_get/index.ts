/** OPENAPI-CLASS : get-campaigns */

import UserRoute from "@src/features/routes/UserRoute";
import { tryber } from "@src/features/database";
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

  protected async prepare(): Promise<void> {
    return this.setSuccess(200, await this.getCampaigns());
  }

  private async getCampaigns() {
    let result = tryber.tables.WpAppqEvdCampaign.do().select(
      "id",
      tryber.ref("title").withSchema("wp_appq_evd_campaign").as("name")
    );

    if (this.accessibleCampaigns === true) {
      return await result;
    }
    if (this.accessibleCampaigns.length > 0) {
      return await result.whereIn("id", this.accessibleCampaigns);
    }

    return [];
  }
}

export default RouteItem;
