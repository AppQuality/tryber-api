/** OPENAPI-CLASS: get-users-me-campaigns-cid-preview */

import UserRoute from "@src/features/routes/UserRoute";
import Campaigns, { CampaignObject } from "@src/features/db/class/Campaigns";
import PageAccess from "@src/features/db/class/PageAccess";

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
    const results = await this.db.campaigns.query({
      where: [{ id: this.campaignId }],
    });
    if (results.length === 0) {
      throw new Error("Campaign not found");
    }

    return {
      content: "content",
      campaignType: "campaignType",
      startDate: "startDate",
      endDate: "endDate",
      tl: {
        name: "tlName",
        email: "tlEmail",
      },
    };
    // return results[0];
  }
}

export default GetCampaignPreviewV2;
