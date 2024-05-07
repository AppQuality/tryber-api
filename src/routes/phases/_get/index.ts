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
    const results = await tryber.tables.CampaignPhase.do()
      .join(
        "campaign_phase_type",
        "campaign_phase_type.id",
        "campaign_phase.type_id"
      )
      .select(
        tryber.ref("id").withSchema("campaign_phase"),
        tryber.ref("name").withSchema("campaign_phase"),
        tryber.ref("id").withSchema("campaign_phase_type").as("type_id"),
        tryber.ref("name").withSchema("campaign_phase_type").as("type_name")
      );
    this.setSuccess(200, {
      results: results.map((phase) => ({
        id: phase.id,
        name: phase.name,
        type: { id: phase.type_id, name: phase.type_name },
      })),
    });
  }
}
