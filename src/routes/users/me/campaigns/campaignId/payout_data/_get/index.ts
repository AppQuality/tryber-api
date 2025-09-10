/** OPENAPI-CLASS: get-users-me-campaigns-cid-payout-data */

import UserRoute from "@src/features/routes/UserRoute";
import Campaigns, { CampaignObject } from "@src/features/db/class/Campaigns";
import PageAccess from "@src/features/db/class/PageAccess";
import { tryber } from "@src/features/database";

type SuccessType =
  StoplightOperations["get-users-me-campaigns-cid-payout-data"]["responses"]["200"]["content"]["application/json"];

class GetCampaignPayoutData extends UserRoute<{
  response: SuccessType;
  parameters: StoplightOperations["get-users-me-campaigns-cid-payout-data"]["parameters"]["path"];
}> {
  private campaignId: number;
  private campaign: CampaignObject | false = false;

  private payoutKeys = [
    "campaign_complete_bonus_eur",
    "campaign_pts",
    "critical_bug_payout",
    "high_bug_payout",
    "low_bug_payout",
    "medium_bug_payout",
    "minimum_bugs",
    "payout_limit",
    "percent_usecases",
    "point_multiplier_critical",
    "point_multiplier_high",
    "point_multiplier_low",
    "point_multiplier_medium",
    "point_multiplier_perfect",
    "point_multiplier_refused",
    "top_tester_bonus",
  ];

  private db: {
    campaigns: Campaigns;
    pageAccess: PageAccess;
  };

  constructor(options: GetCampaignPayoutData["configuration"]) {
    super(options);
    const parameters = this.getParameters();
    this.campaignId = parseInt(parameters.campaignId);
    this.db = {
      campaigns: new Campaigns(),
      pageAccess: new PageAccess(),
    };
  }

  protected async filter() {
    const campaign = await this.getCampaign();
    if (!campaign) {
      this.setError(404, new Error("Campaign not found") as OpenapiError);
      return false;
    }
    if ((await this.hasAccess()) === false) {
      this.setError(404, new Error("Campaign not found") as OpenapiError);
      return false;
    }

    if (campaign.isCampaignV2() === false) {
      this.setError(404, new Error("Preview not found") as OpenapiError);
      return false;
    }

    return true;
  }

  protected async prepare() {
    const payoutData = await this.getFormattedPayoutData();
    this.setSuccess(200, payoutData);
  }

  private async hasAccess() {
    if (this.isNotAdmin() === false) return true;

    const campaign = await this.getCampaign();
    if (!campaign) return false;
    return await campaign.testerHasAccess(this.getTesterId());
  }

  private async getCampaign() {
    if (!this.campaign) {
      try {
        const campaign = await this.db.campaigns.get(this.campaignId);
        this.campaign = campaign;
      } catch (e) {
        this.campaign = false;
      }
    }
    return this.campaign;
  }

  /**
   * Retrieves payout data for the campaign
   * @returns Array of objects with meta_key and meta_value
   */
  private async retrievePayoutData() {
    const results = await tryber.tables.WpAppqCpMeta.do()
      .select("meta_value", "meta_key")
      .whereIn("meta_key", this.payoutKeys)
      .andWhere({ campaign_id: this.campaignId });

    if (!results) {
      throw new Error("Payout data not found");
    }

    return results;
  }

  private async getFormattedPayoutData() {
    const results = await this.retrievePayoutData();
    return {
      campaign_complete_bonus_eur: this.evaluatePayoutField(
        "campaign_complete_bonus_eur",
        results
      ),
      campaign_pts: this.campaign ? this.campaign.campaign_pts || 0 : 0,
      critical_bug_payout: this.evaluatePayoutField(
        "critical_bug_payout",
        results
      ),
      high_bug_payout: this.evaluatePayoutField("high_bug_payout", results),
      low_bug_payout: this.evaluatePayoutField("low_bug_payout", results),
      medium_bug_payout: this.evaluatePayoutField("medium_bug_payout", results),
      minimum_bugs: this.evaluatePayoutField("minimum_bugs", results),
      payout_limit: this.evaluatePayoutField("payout_limit", results),
      percent_usecases: this.evaluatePayoutField("percent_usecases", results),
      point_multiplier_critical: this.evaluatePayoutField(
        "point_multiplier_critical",
        results
      ),
      point_multiplier_high: this.evaluatePayoutField(
        "point_multiplier_high",
        results
      ),
      point_multiplier_low: this.evaluatePayoutField(
        "point_multiplier_low",
        results
      ),
      point_multiplier_medium: this.evaluatePayoutField(
        "point_multiplier_medium",
        results
      ),
      point_multiplier_perfect: this.evaluatePayoutField(
        "point_multiplier_perfect",
        results
      ),
      point_multiplier_refused: this.evaluatePayoutField(
        "point_multiplier_refused",
        results
      ),
      top_tester_bonus: this.evaluatePayoutField("top_tester_bonus", results),
    };
  }

  private evaluatePayoutField(
    key: string,
    payoutData: Awaited<ReturnType<typeof this.retrievePayoutData>>
  ) {
    const isEuroField = key.includes("_eur") || key.includes("bonus");
    if (isEuroField) {
      const value =
        payoutData.find((r) => r.meta_key === key)?.meta_value || "0";
      return parseFloat(value.replace(",", ".")) || 0;
    }
    return Number(payoutData.find((r) => r.meta_key === key)?.meta_value) || 0;
  }
}

export default GetCampaignPayoutData;
