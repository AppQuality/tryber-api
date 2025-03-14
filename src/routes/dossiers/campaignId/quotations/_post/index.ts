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
  private plan?: { id: number; config: string };
  private template?: { id: number; config: string; price: string | undefined };
  private planIsFromQuotedTemplate: boolean = false;
  private planIsQuoted: boolean = false;

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    this.campaignId = Number(this.getParameters().campaign);
  }

  protected async filter() {
    if (!(await super.filter())) return false;

    const { quote } = this.getBody();

    if (this.doesNotHaveAccessToCampaign()) {
      this.setError(401, new OpenapiError("No access to campaign"));
      return false;
    }

    if (await this.campaignNotExist()) {
      this.setError(404, new OpenapiError("Campaign does not exist"));
      return false;
    }
    if (!this.plan) {
      this.setError(404, new OpenapiError("Plan does not exist"));
      return false;
    }
    if (this.planIsQuoted) {
      this.setError(400, new OpenapiError("Plan already quoted"));
      return false;
    }
    if (!this.isQuotedTemplate() && !quote) {
      this.setError(400, new OpenapiError("Quote required"));
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

  protected async init() {
    this.plan = await tryber.tables.CpReqPlans.do()
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

    if (!this.plan) return;

    this.template = await tryber.tables.CpReqTemplates.do()
      .select(
        tryber.ref("id").withSchema("cp_req_templates"),
        tryber.ref("config").withSchema("cp_req_templates"),
        tryber.ref("price").withSchema("cp_req_templates")
      )
      .join("cp_req_plans", "cp_req_plans.template_id", "cp_req_templates.id")
      .where("cp_req_plans.id", this.plan?.id)
      .first();

    const planQuote = await tryber.tables.CpReqQuotations.do()
      .select("id")
      .where({ plan_id: this.plan?.id })
      .andWhereNot("status", "rejected")
      .first();
    this.planIsQuoted = planQuote?.id ? true : false;
  }

  private isQuotedTemplate() {
    return !!this.template?.price;
  }

  private doesNotHaveAccessToCampaign() {
    return this.configuration.request.user.role !== "administrator";
  }

  protected async createQuotation() {
    if (!this.plan) throw new Error("Plan does not exist");
    const { notes } = this.getBody();
    const pendingQuotation = await tryber.tables.CpReqQuotations.do()
      .insert({
        created_by: this.configuration.request.user.testerId,
        status: await this.evaluateStatus(),
        estimated_cost: await this.evaluatePrice(),
        config: this.plan.config,
        plan_id: this.plan.id,
        ...(notes ? { notes } : {}),
      })
      .returning("id");
    const quotation = { id: pendingQuotation[0].id ?? pendingQuotation[0] };
    if (!quotation || !quotation.id)
      throw new Error("Error creating quotation");
    return quotation;
  }

  protected async prepare() {
    try {
      this.setSuccess(201, await this.createQuotation());
    } catch (e) {
      this.setError(500, e as OpenapiError);
    }
  }

  private async evaluatePrice() {
    const { quote } = this.getBody();

    return quote ?? this.template?.price;
  }

  private async evaluateStatus() {
    const { quote } = this.getBody();

    /**
     * If it's not a quoted template,
     * the status is always pending. We can safely assume that a quote exists.
     */
    if (!this.isQuotedTemplate) {
      return "proposed";
    }

    /**
     * If it's a quoted template,
     * the status is proposed if the quote is different from the template price.
     */
    if (!quote) return "pending";
    if (quote !== this.template?.price) return "proposed";

    return "pending";
  }
}
