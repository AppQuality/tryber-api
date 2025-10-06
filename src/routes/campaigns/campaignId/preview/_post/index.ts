/** OPENAPI-CLASS: post-campaigns-campaign-preview */
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import CampaignRoute from "@src/features/routes/CampaignRoute";

export default class PostCampaignPreview extends CampaignRoute<{
  response: StoplightOperations["post-campaigns-campaign-preview"]["responses"][200]["content"]["application/json"];
  parameters: StoplightOperations["post-campaigns-campaign-preview"]["parameters"]["path"];
  body: StoplightOperations["post-campaigns-campaign-preview"]["requestBody"]["content"]["application/json"];
}> {
  private campaign_id: number;

  constructor(config: RouteClassConfiguration) {
    super(config);
    const parameters = this.getParameters();
    this.campaign_id = parseInt(parameters.campaign);
  }

  protected async filter() {
    if (this.hasAccessCampaign(this.campaign_id) === false) {
      this.setError(403, new Error("You are not authorized.") as OpenapiError);
      return false;
    }

    if (await this.campaignIsNoV2()) {
      this.setError(
        403,
        new Error(
          "You cannot send preview. Campaign is not in v2"
        ) as OpenapiError
      );
      return false;
    }

    return true;
  }

  protected async prepare() {
    await this.insertPreview();
    this.setSuccess(200, {});
  }

  protected async insertPreview() {
    const { content } = this.getBody();
    try {
      await tryber.tables.CampaignPreviews.do().insert({
        campaign_id: this.campaign_id,
        content,
      });
    } catch (error) {
      this.setError(500, new Error("Failed to insert preview") as OpenapiError);
      return false;
    }
  }

  protected hasAccessCampaign(campaignId: number) {
    if (this.isNotAdmin() === false) return true;

    const olp = this.configuration.request.user.permission.admin?.appq_campaign;
    if (!olp) return false;
    return olp === true || olp?.includes(campaignId);
  }

  private async campaignIsNoV2() {
    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select("page_version")
      .where({ id: this.campaign_id })
      .first();
    if (!campaign) return true;
    return campaign.page_version !== "v2";
  }
}
