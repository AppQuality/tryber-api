/** OPENAPI-CLASS: post-dossiers-campaign-quotations */

import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import UserRoute from "@src/features/routes/UserRoute";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["post-dossiers-campaign-quotations"]["responses"]["201"]["content"]["application/json"];
  body: StoplightOperations["post-dossiers-campaign-quotations"]["requestBody"]["content"]["application/json"];
  parameters: StoplightOperations["post-dossiers-campaign-quotations"]["parameters"]["path"];
}> {
  private campaignId: number;
  private plan?: { id: number; config: string };
  private template?: { id: number; config: string; price: string | undefined };
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
    const data = await tryber.tables.CpReqPlans.do()
      .select(
        tryber.ref("id").withSchema("cp_req_plans"),
        tryber.ref("quote_id").withSchema("wp_appq_evd_campaign"),
        tryber.ref("config").withSchema("cp_req_plans"),
        tryber.ref("id").withSchema("cp_req_templates").as("template_id"),
        tryber
          .ref("config")
          .withSchema("cp_req_templates")
          .as("template_config"),
        tryber.ref("price").withSchema("cp_req_templates")
      )
      .join(
        "wp_appq_evd_campaign",
        "wp_appq_evd_campaign.plan_id",
        "cp_req_plans.id"
      )
      .leftJoin(
        "cp_req_templates",
        "cp_req_templates.id",
        "cp_req_plans.template_id"
      )
      .where("wp_appq_evd_campaign.id", this.campaignId)
      .first();

    if (!data) return;

    this.plan = {
      id: data.id,
      config: data.config,
    };

    if (data.template_id) {
      this.template = {
        id: data.template_id,
        config: data.template_config,
        price: data.price,
      };
    }

    this.planIsQuoted = data?.quote_id ? true : false;
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
        generated_from_plan: this.plan.id,
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
      const quotation = await this.createQuotation();

      await this.linkToCampaign(quotation.id);

      this.setSuccess(201, quotation);
    } catch (e) {
      this.setError(500, e as OpenapiError);
    }
  }

  private async linkToCampaign(quoteId: number) {
    await tryber.tables.WpAppqEvdCampaign.do()
      .update({
        quote_id: quoteId,
      })
      .where({ id: this.campaignId });
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
