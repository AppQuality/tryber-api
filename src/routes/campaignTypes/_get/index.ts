/** OPENAPI-CLASS : get-campaign-types */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

class RouteItem extends UserRoute<{
  response: StoplightOperations["get-campaign-types"]["responses"]["200"]["content"]["application/json"];
}> {
  private accessibleCampaigns: true | number[] = this.campaignOlps
    ? this.campaignOlps
    : [];

  protected async filter() {
    if ((await super.filter()) === false) return false;
    if (this.doesNotHaveAccessToCampaigns()) {
      this.setError(403, new OpenapiError("You are not authorized to do this"));
      return false;
    }
    return true;
  }

  private doesNotHaveAccessToCampaigns() {
    return (
      this.accessibleCampaigns !== true && this.accessibleCampaigns.length === 0
    );
  }

  protected async prepare(): Promise<void> {
    const types = await tryber.tables.WpAppqCampaignType.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_campaign_type"),
        tryber.ref("name").withSchema("wp_appq_campaign_type")
      )
      .orderBy("name", "asc");
    return this.setSuccess(200, types);
  }
}

export default RouteItem;
