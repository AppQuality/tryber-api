/** OPENAPI-CLASS: get-phases */
import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

export default class Route extends UserRoute<{
  response: StoplightOperations["get-phases"]["responses"]["200"]["content"]["application/json"];
}> {
  private accessibleCampaigns: true | number[] = this.campaignOlps
    ? this.campaignOlps
    : [];

  protected async filter() {
    if (!(await super.filter())) return false;

    if (this.doesNotHaveAccessToCampaigns()) {
      this.setError(403, new OpenapiError("You are not authorized to do this"));
      return false;
    }
    return true;
  }

  private doesNotHaveAccessToCampaigns() {
    if (Array.isArray(this.accessibleCampaigns))
      return this.accessibleCampaigns.length === 0;
    return this.accessibleCampaigns !== true;
  }
  protected async prepare(): Promise<void> {
    const results = await tryber.tables.CampaignPhase.do().select("id", "name");
    this.setSuccess(200, {
      results,
    });
  }
}
