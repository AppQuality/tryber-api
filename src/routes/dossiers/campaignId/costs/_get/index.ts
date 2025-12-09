/** OPENAPI-CLASS : get-dossiers-campaign-costs */

import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import CampaignRoute from "@src/features/routes/CampaignRoute";

export default class RouteItem extends CampaignRoute<{
  response: StoplightOperations["get-dossiers-campaign-costs"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-dossiers-campaign-costs"]["parameters"]["path"];
  query: StoplightOperations["get-dossiers-campaign-costs"]["parameters"]["query"];
}> {
  private campaignId: number;
  private filterBy: {
    type?: string[];
  } = {};

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    const query = this.getQuery();
    this.campaignId = Number(this.getParameters().campaign);
    if (query.filterBy && query.filterBy?.type) {
      const types = (query.filterBy?.type as string)
        .split(",")
        .map((t) => Number(t))
        .filter((t) => !isNaN(t))
        .map((t) => t.toString());
      if (types.length > 0) {
        this.filterBy.type = types;
      }
    }
  }

  protected async filter() {
    if (!(await super.filter())) return false;

    if (!this.hasAccessToCampaign(this.campaignId)) {
      this.setError(403, new OpenapiError("You are not authorized to do this"));
      return false;
    }

    if (!(await this.campaignExists())) {
      this.setError(403, new OpenapiError("Campaign does not exist"));
      return false;
    }

    return true;
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
    const cost = await this.calculateTotalCost();
    return this.setSuccess(200, cost);
  }

  private async calculateTotalCost() {
    let query = tryber.tables.WpAppqPayment.do().where({
      campaign_id: this.campaignId,
    });

    if (this.filterBy && this.filterBy.type !== undefined) {
      query = query.whereIn("work_type_id", this.filterBy.type);
    }

    const paymentsTotal = (await query
      .sum("amount as totalAmount")
      .first()) as unknown as { totalAmount: string | number | null };

    return {
      totalCost: paymentsTotal ? Number(paymentsTotal.totalAmount || 0) : 0,
    };
  }
}
