/** OPENAPI-CLASS : get-dossiers-campaign-costs */

import OpenapiError from "@src/features/OpenapiError";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

export default class RouteItem extends UserRoute<{
  response: StoplightOperations["get-dossiers-campaign-costs"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-dossiers-campaign-costs"]["parameters"]["path"];
  query: StoplightOperations["get-dossiers-campaign-costs"]["parameters"]["query"];
}> {
  private campaignId: number;
  private filterBy: {
    type?: string | string[];
  } = {};

  constructor(configuration: RouteClassConfiguration) {
    super(configuration);
    const query = this.getQuery();
    this.campaignId = Number(this.getParameters().campaign);
    if (query.filterBy) {
      this.filterBy = query.filterBy;
    }
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
    const cost = await this.calculateTotalCost();
    return this.setSuccess(200, cost);
  }

  private async calculateTotalCost() {
    let query = tryber.tables.WpAppqPayment.do().where({
      campaign_id: this.campaignId,
    });

    if (this.filterBy && this.filterBy.type !== undefined) {
      const rawTypes = Array.isArray(this.filterBy.type)
        ? this.filterBy.type
        : [this.filterBy.type];

      const types = rawTypes
        .map((t) => Number(t))
        .filter((t) => !Number.isNaN(t));

      if (types.length > 0) {
        query = query.whereIn("work_type_id", types);
      }
    }

    const paymentsTotal = (await query
      .sum("amount as totalAmount")
      .first()) as unknown as { totalAmount: string | number | null };

    return {
      totalCost: paymentsTotal ? Number(paymentsTotal.totalAmount || 0) : 0,
    };
  }
}
