/** OPENAPI-CLASS: get-dossiers-campaign-agreements*/

import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import UserRoute from "@src/features/routes/UserRoute";

type AgreementWithRemainingTokens = {
  campaignTokens: number;
  remainingTokens: number | string;
  totalTokens: number;
  tokenUnitPrice: number;
  id: number;
  title: string;
};

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["get-dossiers-campaign-agreements"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-dossiers-campaign-agreements"]["parameters"]["path"];
}> {
  private campaignId: number;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    this.campaignId = Number(this.getParameters().campaign);
  }

  protected async filter() {
    if (!(await super.filter())) return false;

    if (await this.doesNotHaveAccessToCampaign()) {
      this.setError(403, new OpenapiError("No access to campaign"));
      return false;
    }

    if (!(await this.campaignExists())) {
      this.setError(403, new OpenapiError("Campaign does not exist"));
      return false;
    }

    return true;
  }

  private async doesNotHaveAccessToCampaign() {
    return !this.hasAccessToCampaign(this.campaignId);
  }

  private async campaignExists(): Promise<boolean> {
    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select("id")
      .where({
        id: this.campaignId,
      })
      .first();
    if (!campaign) return false;

    return true;
  }

  protected async prepare(): Promise<void> {
    const agreements = await this.getAgreements();
    return this.setSuccess(200, agreements);
  }

  private async getAgreements() {
    const agreements = await tryber.tables.FinanceAgreements.do()
      .select(
        tryber.ref("id").withSchema("finance_agreements"),
        tryber.ref("title").withSchema("finance_agreements"),
        tryber
          .ref("tokens_usage")
          .withSchema("wp_appq_evd_campaign")
          .as("campaignTokens"),
        tryber
          .ref("token_unit_price")
          .withSchema("finance_agreements")
          .as("tokenUnitPrice"),
        tryber.ref("tokens").withSchema("finance_agreements").as("totalTokens"),
        tryber
          .ref("is_token_based")
          .withSchema("finance_agreements")
          .as("isTokenBased"),
        tryber.raw(`
        ROUND(
          (
            finance_agreements.tokens -
            COALESCE(
              (
                SELECT SUM(wp_appq_evd_campaign.tokens_usage)
                FROM finance_campaign_to_agreement
                JOIN wp_appq_evd_campaign
                  ON wp_appq_evd_campaign.id = finance_campaign_to_agreement.cp_id
                WHERE finance_campaign_to_agreement.agreement_id = finance_agreements.id
              ),
              0
            )
          ), 2
        ) as remainingTokens
      `)
      )
      .join(
        "finance_campaign_to_agreement",
        "finance_agreements.id",
        "finance_campaign_to_agreement.agreement_id"
      )
      .join(
        "wp_appq_evd_campaign",
        "finance_campaign_to_agreement.cp_id",
        "wp_appq_evd_campaign.id"
      )
      .where("finance_campaign_to_agreement.cp_id", this.campaignId);

    const row = agreements[0] as unknown as AgreementWithRemainingTokens;
    return {
      tokens: row.campaignTokens,
      agreement: {
        id: row.id,
        name: row.title,
        totalTokens: Number(row.totalTokens),
        remainingTokens: Number(row.remainingTokens),
        value: Number(row.tokenUnitPrice),
      },
    };
  }
}
