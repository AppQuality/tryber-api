/** OPENAPI-CLASS : get-campaigns */

import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

const ACCEPTABLE_FIELDS = ["id" as const, "title" as const];

class RouteItem extends UserRoute<{
  response: StoplightOperations["get-campaigns"]["responses"]["200"]["content"]["application/json"];
  query: StoplightOperations["get-campaigns"]["parameters"]["query"];
}> {
  private accessibleCampaigns: true | number[] = [];
  private fields: typeof ACCEPTABLE_FIELDS = ["id" as const, "title" as const];

  protected async init() {
    if (this.configuration.request.user.permission.admin?.appq_campaign) {
      this.accessibleCampaigns =
        this.configuration.request.user.permission.admin?.appq_campaign;
    }
    const query = this.getQuery();
    if (query.fields) {
      this.fields = query.fields
        .split(",")
        .map((field) => (field === "name" ? "title" : field))
        .filter((field): field is typeof ACCEPTABLE_FIELDS[number] =>
          ACCEPTABLE_FIELDS.includes(field as any)
        );
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
    const campaigns = await this.getCampaigns();
    return this.setSuccess(200, campaigns);
  }

  private async getCampaigns() {
    let query = tryber.tables.WpAppqEvdCampaign.do().select(this.fields);

    if (
      this.accessibleCampaigns !== true &&
      this.accessibleCampaigns.length === 0
    ) {
      return [];
    }

    if (Array.isArray(this.accessibleCampaigns)) {
      query = query.whereIn("id", this.accessibleCampaigns);
    }

    return (await query).map((campaign) => ({
      id: campaign.id ? campaign.id : undefined,
      name: campaign.title ? campaign.title : undefined,
    }));
  }
}

export default RouteItem;
