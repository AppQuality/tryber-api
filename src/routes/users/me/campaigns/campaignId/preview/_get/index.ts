/** OPENAPI-CLASS: get-users-me-campaigns-cid-preview */

import UserRoute from "@src/features/routes/UserRoute";
import Campaigns, { CampaignObject } from "@src/features/db/class/Campaigns";
import PageAccess from "@src/features/db/class/PageAccess";
import { tryber } from "@src/features/database";

type SuccessType =
  StoplightOperations["get-users-me-campaigns-cid-preview"]["responses"]["200"]["content"]["application/json"];

class GetCampaignPreviewV2 extends UserRoute<{
  response: SuccessType;
  parameters: StoplightOperations["get-users-me-campaigns-cid-preview"]["parameters"]["path"];
}> {
  private campaignId: number;
  private campaign: CampaignObject | false = false;

  private db: {
    campaigns: Campaigns;
    pageAccess: PageAccess;
  };

  constructor(options: GetCampaignPreviewV2["configuration"]) {
    super(options);
    const parameters = this.getParameters();
    this.campaignId = parseInt(parameters.campaignId);
    this.db = {
      campaigns: new Campaigns(),
      pageAccess: new PageAccess(),
    };
  }

  protected async filter() {
    const campaign = await this.getCampaign();
    if (!campaign) {
      this.setError(404, new Error("Campaign not found") as OpenapiError);
      return false;
    }
    if ((await this.hasAccess()) === false) {
      this.setError(404, new Error("Campaign not found") as OpenapiError);
      return false;
    }

    if (campaign.isCampaignV2() === false) {
      this.setError(404, new Error("Preview not found") as OpenapiError);
      return false;
    }

    return true;
  }

  protected async prepare() {
    const previewData = await this.retrieveCampaignData();
    this.setSuccess(200, previewData);
  }

  private async hasAccess() {
    if (this.isAdmin()) return true;

    const campaign = await this.getCampaign();
    if (!campaign) return false;
    return await campaign.testerHasAccess(this.getTesterId());
  }

  private async getCampaign() {
    if (!this.campaign) {
      try {
        const campaign = await this.db.campaigns.get(this.campaignId);
        this.campaign = campaign;
      } catch (e) {
        this.campaign = false;
      }
    }
    return this.campaign;
  }

  private async retrieveCampaignData() {
    const res = await tryber.tables.CampaignPreviews.do()
      .select(
        tryber.ref("content").withSchema("campaign_previews"),
        tryber.ref("start_date").withSchema("wp_appq_evd_campaign"),
        tryber.ref("end_date").withSchema("wp_appq_evd_campaign"),
        tryber
          .ref("name")
          .withSchema("wp_appq_campaign_type")
          .as("campaign_type")
      )
      .join(
        "wp_appq_evd_campaign",
        "wp_appq_evd_campaign.id",
        "campaign_previews.campaign_id"
      )
      .join(
        "wp_appq_campaign_type",
        "wp_appq_campaign_type.id",
        "wp_appq_evd_campaign.campaign_type_id"
      )
      .where("campaign_id", this.campaignId)
      .first();

    if (!res) {
      throw new Error("Campaign not found");
    }

    return {
      content: res.content,
      campaignType: res.campaign_type,
      startDate: res.start_date,
      endDate: res.end_date,
      tl: {
        name: "tlName",
        email: "tlEmail",
      },
    };
  }
}

export default GetCampaignPreviewV2;
