/** OPENAPI-CLASS: get-campaigns-campaign-payouts */
import CampaignRoute from "@src/features/routes/CampaignRoute";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";

export default class PayoutRoute extends CampaignRoute<{
  response: StoplightOperations["get-campaigns-campaign-payouts"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign-payouts"]["parameters"]["path"];
}> {
  protected async filter(): Promise<boolean> {
    if (!(await super.filter())) return false;
    if (!this.hasAccessTesterSelection(this.cp_id)) {
      this.setError(403, new OpenapiError("Access denied"));

      return false;
    }
    return true;
  }

  protected async prepare(): Promise<void> {
    const campaignPoints = await this.getCampaignPoints();

    return this.setSuccess(200, {
      maxBonusBug: await this.getMaxBonusBug(),
      testSuccess: {
        payout: await this.getBasePayout(),
        points: campaignPoints.success,
        message: "Ottimo lavoro!",
      },
      testFailure: {
        payout: 0,
        points: campaignPoints.failure,
        message: `Purtroppo non hai completato l’attività, ricevi quindi ${campaignPoints.failure} punti esperienza`,
      },
    });
  }

  private async getMaxBonusBug() {
    const result = await tryber.tables.WpAppqCpMeta.do()
      .select(tryber.ref("meta_value").as("maxBonusBug"))
      .where({ campaign_id: this.cp_id })
      .where("meta_key", "payout_limit")
      .first();

    if (!result) return 0;

    return Number(result.maxBonusBug);
  }

  private async getBasePayout() {
    const result = await tryber.tables.WpAppqCpMeta.do()
      .select(tryber.ref("meta_value").as("basePayout"))
      .where({ campaign_id: this.cp_id })
      .where("meta_key", "campaign_complete_bonus_eur")
      .first();

    if (!result) return 0;

    return Number(result.basePayout);
  }

  private async getCampaignPoints() {
    const result = await tryber.tables.WpAppqEvdCampaign.do()
      .select("campaign_pts")
      .where({ id: this.cp_id })
      .first();

    const campaignCompletionPoints = result?.campaign_pts || 0;

    return {
      success: campaignCompletionPoints,
      failure: campaignCompletionPoints * -2,
    };
  }
}
