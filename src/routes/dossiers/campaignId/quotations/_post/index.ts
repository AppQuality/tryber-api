/** OPENAPI-CLASS: post-dossiers-campaign-quotations */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["post-dossiers-campaign-quotations"]["responses"]["201"]["content"]["application/json"];
  body: StoplightOperations["post-dossiers-campaign-quotations"]["requestBody"]["content"]["application/json"];
  parameters: StoplightOperations["post-dossiers-campaign-quotations"]["parameters"]["path"];
}> {
  private campaignId: number;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    this.campaignId = Number(this.getParameters().campaign);
  }

  protected async filter() {
    if (!(await super.filter())) return false;

    if (await this.doesNotHaveAccessToCampaign()) {
      this.setError(401, new OpenapiError("No access to campaign"));
      return false;
    }

    if (await this.campaignNotExists()) {
      this.setError(404, new OpenapiError("Campaign does not exist"));
      return false;
    }
    if (await this.planNotExists()) {
      this.setError(404, new OpenapiError("Plan does not exist"));
      return false;
    }

    return true;
  }

  private async doesNotHaveAccessToCampaign() {
    return this.configuration.request.user.role !== "administrator";
    // return !this.hasAccessToCampaign(this.campaignId);
  }

  private async campaignNotExists() {
    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({
        id: this.campaignId,
      })
      .first();
    return !campaign;
  }

  private async planNotExists() {
    const plan = await tryber.tables.CpReqPlans.do()
      .select(tryber.ref("*").withSchema("cp_req_plans"))
      .join(
        "wp_appq_evd_campaign",
        "wp_appq_evd_campaign.plan_id",
        "cp_req_plans.id"
      )
      .where("wp_appq_evd_campaign.id", this.campaignId)
      .first();
    return !plan;
  }
  private async getPlan() {
    const plan = await tryber.tables.CpReqPlans.do()
      .select(
        tryber.ref("id").withSchema("cp_req_plans"),
        tryber.ref("config").withSchema("cp_req_plans")
      )
      .join(
        "wp_appq_evd_campaign",
        "wp_appq_evd_campaign.plan_id",
        "cp_req_plans.id"
      )
      .where("wp_appq_evd_campaign.id", this.campaignId)
      .first();
    return plan;
  }

  protected async createPendingQuotation() {
    const plan = await this.getPlan();
    if (!plan) throw new Error("Plan does not exist");

    const { quote, notes } = this.getBody();
    const pendingQuotation = await tryber.tables.CpReqQuotations.do()
      .insert({
        created_by: this.configuration.request.user.testerId,
        status: "pending",
        estimated_cost: `€${quote}`,
        //quoted_by_id: 1, //TODO: want we to track who quoted the price?
        config: plan.config,
        plan_id: plan.id,
        ...(notes ? { notes } : {}),
      })
      .returning("id");

    const quotation = { id: pendingQuotation[0].id ?? pendingQuotation[0] };
    if (!quotation || !quotation.id)
      throw new Error("Error creating quotation");
    return quotation;
  }
  protected async prepare(): Promise<void> {
    try {
      const quote_id = this.setSuccess(
        201,
        await this.createPendingQuotation()
      );
    } catch (e) {
      this.setError(500, e as OpenapiError);
    }
  }
}
