/** OPENAPI-CLASS: put-dossiers-campaign-phases */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";
import { StatusChangeHandler } from "./StatusChangeHandler";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["put-dossiers-campaign-phases"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["put-dossiers-campaign-phases"]["parameters"]["path"];
  body: StoplightOperations["put-dossiers-campaign-phases"]["requestBody"]["content"]["application/json"];
}> {
  private campaignId: number;
  private newPhaseId: number;
  private accessibleCampaigns: true | number[] = this.campaignOlps
    ? this.campaignOlps
    : [];
  private _campaign?: { id: number; phase_id: number };

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    this.campaignId = Number(this.getParameters().campaign);
    this.newPhaseId = this.getBody().phase;
  }

  get campaign() {
    if (!this._campaign) throw new Error("Campaign not loaded");
    return this._campaign;
  }

  protected async init() {
    this._campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select("id", "phase_id")
      .where("id", this.campaignId)
      .first();
  }

  protected async filter() {
    if (!(await super.filter())) return false;

    if (
      (await this.doesNotHaveAccess()) ||
      (await this.campaignDoesNotExists())
    ) {
      this.setError(403, new OpenapiError("You are not authorized to do this"));
      return false;
    }

    if (this.newPhaseId === this.campaign.phase_id) {
      this.setError(
        400,
        new OpenapiError("The campaign is already in this phase")
      );
      return false;
    }

    return true;
  }

  private async doesNotHaveAccess() {
    if (this.accessibleCampaigns === true) return false;
    if (Array.isArray(this.accessibleCampaigns))
      return !this.accessibleCampaigns.includes(this.campaignId);
    return true;
  }

  private async campaignDoesNotExists() {
    try {
      this.campaign;
      return false;
    } catch (error) {
      return true;
    }
  }

  protected async prepare() {
    const newPhase = await this.updatePhase();

    this.setSuccess(200, newPhase);
  }

  private async updatePhase() {
    await tryber.tables.WpAppqEvdCampaign.do()
      .update({ phase_id: this.newPhaseId })
      .where("id", this.campaignId);

    const result = await tryber.tables.WpAppqEvdCampaign.do()
      .select(tryber.ref("id").withSchema("campaign_phase"), "name")
      .join(
        "campaign_phase",
        "campaign_phase.id",
        "wp_appq_evd_campaign.phase_id"
      )
      .where("wp_appq_evd_campaign.id", this.campaignId)
      .first();

    await this.triggerStatusChange();
    return result;
  }

  private async triggerStatusChange() {
    const handler = new StatusChangeHandler(
      this.campaign.phase_id,
      this.newPhaseId
    );

    await handler.run();
  }
}
