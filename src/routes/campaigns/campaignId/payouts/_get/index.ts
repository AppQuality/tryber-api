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
    const config = await this.getCampaignConfig();

    return this.setSuccess(200, {
      maxBonusBug: config.maxBonusBug,
      completionRule: {
        bugs: config.minimumBugs,
        usecases: config.percentUsecases,
      },
      testSuccess: {
        payout: config.basePayout,
        points: config.campaignPoints.success,
        message: "Ottimo lavoro!",
      },
      testFailure: {
        payout: 0,
        points: config.campaignPoints.failure,
        message: `Purtroppo non hai completato l’attività, ricevi quindi ${config.campaignPoints.failure} punti esperienza`,
      },
    });
  }

  private async getCampaignConfig() {
    const result = await tryber.tables.WpAppqCpMeta.do()
      .select(["meta_key", "meta_value"])
      .where({ campaign_id: this.cp_id })
      .where("meta_key", "IN", [
        "minimum_bugs",
        "percent_usecases",
        "payout_limit",
        "campaign_complete_bonus_eur",
      ]);

    const config = {
      minimumBugs: 0,
      percentUsecases: 0,
      maxBonusBug: 0,
      campaignPoints: { success: 0, failure: 0 },
      basePayout: 0,
    };
    for (const row of result) {
      switch (row.meta_key) {
        case "minimum_bugs":
          config.minimumBugs = Number(row.meta_value);
          break;
        case "percent_usecases":
          config.percentUsecases = Number(row.meta_value);
          break;
        case "payout_limit":
          config.maxBonusBug = Number(row.meta_value);
          break;
        case "campaign_complete_bonus_eur":
          config.basePayout = Number(row.meta_value);
          break;
      }
    }

    const campaignPoints = await tryber.tables.WpAppqEvdCampaign.do()
      .select("campaign_pts")
      .where({ id: this.cp_id })
      .first();

    if (campaignPoints) {
      config.campaignPoints.success = campaignPoints.campaign_pts;
      config.campaignPoints.failure = campaignPoints.campaign_pts * -2;
    }

    return config;
  }
}
