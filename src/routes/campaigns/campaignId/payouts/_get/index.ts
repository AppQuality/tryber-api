/** OPENAPI-CLASS: get-campaigns-campaign-payouts */
import CampaignRoute from "@src/features/routes/CampaignRoute";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";

export default class PayoutRoute extends CampaignRoute<{
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
    return this.setSuccess(200, { maxBonusBug: await this.getMaxBonusBug() });
  }

  private async getMaxBonusBug() {
    const result = await tryber.tables.WpAppqCpMeta.do()
      .select(tryber.ref("meta_value").as("maxBonusBug"))
      .where({ campaign_id: this.cp_id })
      .where("meta_key", "payout_limit")
      .first();

    if (!result) return 0;

    return Number(result.maxBonusBug);
  }
}
