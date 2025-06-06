/** OPENAPI-CLASS: get-dossiers-campaign-quotes-history */

import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import CampaignRoute from "@src/features/routes/CampaignRoute";
type PlanStatus =
  StoplightOperations["get-dossiers-campaign-quotes-history"]["responses"]["200"]["content"]["application/json"]["items"][number]["quote"]["status"];

export default class RouteItem extends CampaignRoute<{
  response: StoplightOperations["get-dossiers-campaign-quotes-history"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-dossiers-campaign-quotes-history"]["parameters"]["path"];
}> {
  private campaignId: number;
  private accessibleCampaigns: true | number[] = this.campaignOlps
    ? this.campaignOlps
    : [];

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    this.campaignId = Number(this.getParameters().campaign);
  }

  protected async filter() {
    if (!(await super.filter())) return false;

    if (this.doesNotHaveAccessToCampaign()) {
      this.setError(401, new OpenapiError("No access to campaign"));
      return false;
    }

    return true;
  }

  private async getDossierPlanId() {
    const cp = await tryber.tables.WpAppqEvdCampaign.do()
      .select("plan_id")
      .where({ id: this.campaignId })
      .first();
    return cp?.plan_id;
  }

  private doesNotHaveAccessToCampaign() {
    if (this.accessibleCampaigns === true) return false;
    if (Array.isArray(this.accessibleCampaigns))
      return !this.accessibleCampaigns.includes(this.campaignId);
    return true;
  }

  protected async prepare() {
    try {
      this.setSuccess(200, {
        items: await this.getItems(),
      });
    } catch (e) {
      this.setError(500, e as OpenapiError);
    }
  }

  private async getItems() {
    const planId = await this.getDossierPlanId();
    if (!planId) return [];

    const quotes = await tryber.tables.CpReqQuotations.do()
      .select(
        tryber.ref("id").withSchema("cp_req_quotations").as("quote_id"),
        tryber.ref("estimated_cost").withSchema("cp_req_quotations"),
        tryber.ref("status").withSchema("cp_req_quotations"),
        tryber.ref("id").withSchema("wp_appq_evd_campaign").as("campaign_id"),
        tryber.ref("title").withSchema("wp_appq_evd_campaign"),
        tryber.ref("phase_id").withSchema("wp_appq_evd_campaign"),
        tryber.ref("name").withSchema("campaign_phase").as("phase_name")
      )
      .where("cp_req_quotations.generated_from_plan", planId)
      .join(
        "wp_appq_evd_campaign",
        "wp_appq_evd_campaign.quote_id",
        "cp_req_quotations.id"
      )
      .join(
        "campaign_phase",
        "campaign_phase.id",
        "wp_appq_evd_campaign.phase_id"
      );

    if (!quotes) return [];

    return quotes.map((quote) => ({
      quote: {
        id: quote.quote_id,
        amount: quote.estimated_cost,
        status: quote.status as PlanStatus,
      },
      campaign: {
        id: quote.campaign_id,
        title: quote.title,
        phase_id: quote.phase_id,
        phase_name: quote.phase_name,
      },
    }));
  }
}
