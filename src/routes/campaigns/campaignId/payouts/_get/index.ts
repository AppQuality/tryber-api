/** OPENAPI-CLASS: get-campaigns-campaign-payouts */
import CampaignRoute from "@src/features/routes/CampaignRoute";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
export default class PauoutRoute extends CampaignRoute<{
  response: StoplightOperations["get-campaigns-campaign-payouts"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign-payouts"]["parameters"]["path"];
}> {
  protected async filter(): Promise<boolean> {
    if (!(await super.filter())) return false;
    if (
      !this.hasAccessTesterSelection(this.cp_id) ||
      !this.hasAccessToProspect(this.cp_id)
    ) {
      this.setError(403, new OpenapiError("Access denied"));

      return false;
    }
    return true;
  }

  protected async prepare(): Promise<void> {
    let payouts;
    try {
      payouts = { maxBonusBug: await this.getMaxBonusBug() };
    } catch (e: any) {
      return this.setError(
        500,
        new OpenapiError(
          e.message || "There was an error while fetching payouts"
        )
      );
    }

    if (!payouts || !payouts.maxBonusBug)
      return this.setError(
        500,
        new OpenapiError("There was an error while fetching payouts")
      );

    return this.setSuccess(200, payouts);
  }

  private async getMaxBonusBug() {
    const limitPayout = await tryber.tables.WpAppqCpMeta.do()
      .select(tryber.ref("meta_value").as("maxBonusBug"))
      .where({ campaign_id: this.cp_id })
      .where("meta_key", "payout_limit");
    if (!limitPayout || !limitPayout[0] || !limitPayout[0].maxBonusBug)
      return 0 as const;
    return Number(limitPayout[0].maxBonusBug);
  }
}
