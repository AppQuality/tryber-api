/** OPENAPI-CLASS: get-campaigns-campaign */

import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import CampaignRoute from "@src/features/routes/CampaignRoute";
export default class SingleCampaignRoute extends CampaignRoute<{
  response: StoplightOperations["get-campaigns-campaign"]["responses"]["200"]["content"]["application/json"];
  parameters: StoplightOperations["get-campaigns-campaign"]["parameters"]["path"];
}> {
  protected async filter(): Promise<boolean> {
    if (!(await super.filter())) return false;

    if (!this.hasAccessToCampaign(this.cp_id)) {
      this.setError(403, new OpenapiError("Access denied"));
      return false;
    }

    return true;
  }

  protected async prepare(): Promise<void> {
    return this.setSuccess(200, {
      id: this.cp_id,
      title: await this.getCampaignTitle(),
      ...(await this.getCampaignType()),
    });
  }

  private async getCampaignTitle() {
    const campaignTitle = await tryber.tables.WpAppqEvdCampaign.do()
      .select("title")
      .where({ id: this.cp_id })
      .first();
    if (campaignTitle === undefined) return "";
    return campaignTitle.title;
  }

  private async getCampaignType() {
    const campaignType = await tryber.tables.WpAppqCampaignType.do()
      .select(
        tryber.ref("name").withSchema("wp_appq_campaign_type"),
        tryber.ref("description").withSchema("wp_appq_campaign_type")
      )
      .join(
        "wp_appq_evd_campaign",
        "wp_appq_evd_campaign.campaign_type_id",
        "wp_appq_campaign_type.id"
      )
      .where("wp_appq_evd_campaign.id", this.cp_id)
      .first();
    if (!campaignType?.description)
      throw new Error("Campaign type description not found");
    if (!campaignType?.name) throw new Error("Campaign type not found");
    return {
      type: campaignType.name,
      typeDescription: campaignType.description,
    };
  }
}
