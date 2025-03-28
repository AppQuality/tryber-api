/** OPENAPI-CLASS: patch-dossiers-campaign-quotations-quote */

import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import UserRoute from "@src/features/routes/UserRoute";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["patch-dossiers-campaign-quotations-quote"]["responses"]["200"]["content"]["application/json"];
  body: StoplightOperations["patch-dossiers-campaign-quotations-quote"]["requestBody"]["content"]["application/json"];
  parameters: StoplightOperations["patch-dossiers-campaign-quotations-quote"]["parameters"]["path"];
}> {
  private campaignId: number;
  private quoteId: number;
  private quote?: { id: number; estimated_cost: string; status: string };

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    this.campaignId = Number(this.getParameters().campaign);
    this.quoteId = Number(this.getParameters().quote);
  }

  private async getQuote() {
    if (this.quote) return this.quote;
    this.quote = await tryber.tables.CpReqQuotations.do()
      .select(
        tryber.ref("id").withSchema("cp_req_quotations"),
        tryber.ref("estimated_cost").withSchema("cp_req_quotations"),
        tryber.ref("status").withSchema("cp_req_quotations")
      )
      .where("cp_req_quotations.id", this.quoteId)
      .andWhereNot("cp_req_quotations.status", "approved")
      .join(
        "wp_appq_evd_campaign",
        "wp_appq_evd_campaign.quote_id",
        "cp_req_quotations.id"
      )
      .andWhere("wp_appq_evd_campaign.id", this.campaignId)
      .first();

    return this.quote;
  }

  protected async filter() {
    if (!(await super.filter())) return false;

    if (await this.campaignNotExist()) {
      this.setError(404, new OpenapiError("Campaign does not exist"));
      return false;
    }

    if (this.doesNotHaveAccessToCampaign()) {
      this.setError(401, new OpenapiError("No access to campaign"));
      return false;
    }

    const quote = await this.getQuote();
    if (!quote) {
      this.setError(404, new OpenapiError("Quotation does not exist"));
      return false;
    }

    if (quote.status !== "pending" && !this.getBody().amount) {
      this.setError(400, new OpenapiError("Amount required"));
      return false;
    }

    if (quote.status === "rejected") {
      this.setError(403, new OpenapiError("Can't update rejected quotation"));
      return false;
    }

    return true;
  }
  private async campaignNotExist() {
    const cp = await tryber.tables.WpAppqEvdCampaign.do()
      .select("id")
      .where({ id: this.campaignId })
      .first();
    return cp?.id ? false : true;
  }

  private doesNotHaveAccessToCampaign() {
    return this.configuration.request.user.role !== "administrator";
  }

  protected async prepare() {
    try {
      await this.patchQuote();
      this.setSuccess(200, {});
    } catch (e) {
      this.setError(500, e as OpenapiError);
    }
  }

  private async approveQuote() {
    await tryber.tables.CpReqQuotations.do()
      .where({
        id: this.quoteId,
      })
      .update({ status: "approved" });
    const planId = await tryber.tables.WpAppqEvdCampaign.do()
      .select("plan_id")
      .where({ id: this.campaignId })
      .first();
    if (!planId) return;

    await tryber.tables.CpReqPlans.do()
      .where({
        id: planId.plan_id,
      })
      .update({ status: "approved" });

    await tryber.tables.WpAppqEvdCampaign.do()
      .where({
        id: this.campaignId,
      })
      .update({ phase_id: 10 });
  }

  private async proposeQuote({ incomingAmount }: { incomingAmount?: string }) {
    await tryber.tables.CpReqQuotations.do()
      .where({
        id: this.quoteId,
      })
      .update({ status: "proposed", estimated_cost: incomingAmount });
  }

  private async patchQuote() {
    const quote = await this.getQuote();
    if (!quote) throw new Error("Quotation does not exist");
    const actualAmount = quote.estimated_cost;

    let updatingAmount = false;
    const { amount: incomingAmount } = this.getBody();
    if (incomingAmount && incomingAmount !== actualAmount) {
      updatingAmount = true;
    }

    if (quote.status === "pending" && !updatingAmount) {
      await this.approveQuote();
    }

    if (updatingAmount) {
      await this.proposeQuote({ incomingAmount });
    }
  }
}
