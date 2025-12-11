/** OPENAPI-CLASS : get-customers-customerId-agreements */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

class RouteItem extends UserRoute<{
  response: StoplightOperations["get-customers-customerId-agreements"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-customers-customerId-agreements"]["parameters"]["path"];
}> {
  private accessibleCampaigns: true | number[] = this.campaignOlps
    ? this.campaignOlps
    : [];
  private customerId: number;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    this.customerId = Number(this.getParameters().customerId);
  }

  protected async filter() {
    if ((await super.filter()) === false) return false;

    if (await this.doesNotHaveAccessToCustomerCampaigns()) {
      this.setError(403, new OpenapiError("You are not authorized to do this"));
      return false;
    }
    if (await this.customerDoesNotExist()) {
      this.setError(403, new OpenapiError("Customer does not exist"));
      return false;
    }
    return true;
  }

  private async getCustomerCampaignIds(): Promise<number[]> {
    const campaigns = await tryber.tables.WpAppqEvdCampaign.do()
      .select("wp_appq_evd_campaign.id")
      .join(
        "wp_appq_project",
        "wp_appq_evd_campaign.project_id",
        "wp_appq_project.id"
      )
      .where("wp_appq_project.customer_id", this.customerId);

    return campaigns.map((c) => c.id);
  }

  private async doesNotHaveAccessToCustomerCampaigns() {
    if (this.accessibleCampaigns === true) return false;

    const customerCampaignIds = await this.getCustomerCampaignIds();

    return !customerCampaignIds.some((id) =>
      (this.accessibleCampaigns as number[]).includes(id)
    );
  }

  private async customerDoesNotExist() {
    const results = await tryber.tables.WpAppqCustomer.do()
      .select("id")
      .where("id", this.customerId);

    return results.length === 0;
  }

  protected async prepare(): Promise<void> {
    return this.setSuccess(200, {
      items: await this.getAgreements(),
    });
  }

  private async getUsedTokens(agreementId: number): Promise<number> {
    const result = await tryber.tables.WpAppqEvdCampaign.do()
      .sum("tokens_usage", { as: "usedTokens" })
      .join(
        "finance_campaign_to_agreement",
        "wp_appq_evd_campaign.id",
        "finance_campaign_to_agreement.cp_id"
      )
      .where("finance_campaign_to_agreement.agreement_id", agreementId)
      .first();

    return result?.usedTokens ?? 0;
  }

  private calculateRemainingTokens(total: number, used: number): number {
    return Math.round((total - used) * 10) / 10;
  }

  private async getAgreements() {
    const agreements = await tryber.tables.FinanceAgreements.do()
      .select(
        tryber.ref("id").withSchema("finance_agreements"),
        tryber.ref("title").withSchema("finance_agreements"),
        tryber.ref("tokens").withSchema("finance_agreements").as("totalTokens"),
        tryber
          .ref("token_unit_price")
          .withSchema("finance_agreements")
          .as("tokenUnitPrice")
      )
      .where("finance_agreements.customer_id", this.customerId);

    if (!agreements) throw new Error("Agreements not found");

    return Promise.all(
      agreements.map(async (agreement) => {
        const usedTokens = await this.getUsedTokens(agreement.id);
        const remainingTokens = this.calculateRemainingTokens(
          agreement.totalTokens,
          usedTokens
        );

        return {
          id: agreement.id,
          name: agreement.title,
          totalTokens: Number(agreement.totalTokens),
          remainingTokens,
          value: Number(agreement.tokenUnitPrice),
        };
      })
    );
  }
}

export default RouteItem;
