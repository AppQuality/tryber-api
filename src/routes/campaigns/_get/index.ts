/** OPENAPI-CLASS : get-campaigns */

import UserRoute from "@src/features/routes/UserRoute";
import { tryber } from "@src/features/database";
class RouteItem extends UserRoute<{
  response: StoplightOperations["get-campaigns"]["responses"]["200"]["content"]["application/json"];
  query: StoplightOperations["get-campaigns"]["parameters"]["query"];
}> {
  private accessibleCampaigns: true | number[] = [];
  private acceptableFields = ["id", "title"];
  private fields: string[] = [];

  protected async init() {
    if (this.configuration.request.user.permission.admin?.appq_campaign) {
      this.accessibleCampaigns =
        this.configuration.request.user.permission.admin?.appq_campaign;
    }
    const query = this.getQuery();
    if (query.fields) {
      this.fields = query.fields
        .split(",")
        .filter((field) => this.acceptableFields.includes(field));
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
    return this.setSuccess(
      200,
      (await this.getCampaigns()).map((campaign) => {
        return {
          id: campaign.id ? campaign.id : undefined,
          name: campaign.title ? campaign.title : undefined,
        };
      })
    );
  }

  private async getCampaigns() {
    const defaultFields = ["id", "title"];
    let result = tryber.tables.WpAppqEvdCampaign.do().select(
      this.fields?.length > 0 ? this.fields : defaultFields
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
