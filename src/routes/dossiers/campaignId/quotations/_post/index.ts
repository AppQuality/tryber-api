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

    const { quote } = this.getBody();

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

    if (await this.planIsAlreadyQuoted()) {
      this.setError(400, new OpenapiError("Plan already quoted"));
      return false;
    }

    if ((await this.isFromQuotedTemplate()) === false && !quote) {
      this.setError(400, new OpenapiError("Quote required"));
      return false;
    }

    return true;
  }

  private async doesNotHaveAccessToCampaign() {
    return this.configuration.request.user.role !== "administrator";
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

  protected async createQuotation() {
    const plan = await this.getPlan();
    if (!plan) throw new Error("Plan does not exist");

    const { quote, notes } = this.getBody();
    const pendingQuotation = await tryber.tables.CpReqQuotations.do()
      .insert({
        created_by: this.configuration.request.user.testerId,
        status: await this.evaluateStatus(),
        estimated_cost: await this.evaluatePrice(),
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

  private async planIsAlreadyQuoted() {
    const plan = await this.getPlan();
    const quotedQuotation = await tryber.tables.CpReqQuotations.do()
      .select()
      .where("plan_id", plan?.id)
      .first();
    return quotedQuotation ? true : false;
  }

  protected async prepare(): Promise<void> {
    try {
      this.setSuccess(201, await this.createQuotation());
    } catch (e) {
      this.setError(500, e as OpenapiError);
    }
  }

  private async evaluatePrice() {
    const { quote } = this.getBody();

    if (await this.isFromQuotedTemplate()) {
      if (quote) {
        return quote;
      }
      const template = await tryber.tables.CpReqTemplates.do()
        .select(tryber.ref("price").withSchema("cp_req_templates"))
        .join("cp_req_plans", "cp_req_plans.template_id", "cp_req_templates.id")
        .where("cp_req_plans.id", (await this.getPlan())?.id)
        .first();
      if (template && template.price.length > 0) {
        return template.price;
      }
    } else if (quote && quote.length > 0) {
      return quote;
    }
    throw new OpenapiError("Error on evaluating price");
  }
  private async evaluateStatus() {
    const { quote } = this.getBody();
    if (await this.isFromQuotedTemplate()) {
      const quotedPrice = await this.getQuotedPrice();
      if (quote) {
        return quote !== quotedPrice ? "proposed" : "pending";
      } else if (await this.isFromQuotedTemplate()) {
        return "pending";
      }
    } else if (quote) return "proposed";

    throw new OpenapiError("Error on evaluating status");
  }

  private async getQuotedPrice() {
    const plan = await this.getPlan();
    const quotedPrice = await tryber.tables.CpReqTemplates.do()
      .select(tryber.ref("price").withSchema("cp_req_templates"))
      .join("cp_req_plans", "cp_req_plans.template_id", "cp_req_templates.id")
      .where("cp_req_plans.id", plan?.id)
      .first();
    return quotedPrice?.price;
  }

  private async isFromQuotedTemplate() {
    const plan = await this.getPlan();
    const templatePrice = await tryber.tables.CpReqTemplates.do()
      .select(tryber.ref("price").withSchema("cp_req_templates"))
      .join("cp_req_plans", "cp_req_plans.template_id", "cp_req_templates.id")
      .where("cp_req_plans.id", plan?.id)
      .first();
    console.log(templatePrice);

    return templatePrice?.price !== null;
  }
}
