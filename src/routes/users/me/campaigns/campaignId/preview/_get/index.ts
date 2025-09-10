/** OPENAPI-CLASS: get-users-me-campaigns-cid-preview */

import config from "@src/config";
import { tryber } from "@src/features/database";
import Campaigns, { CampaignObject } from "@src/features/db/class/Campaigns";
import PageAccess from "@src/features/db/class/PageAccess";
import UserRoute from "@src/features/routes/UserRoute";

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
    if (this.isNotAdmin() === false) return true;

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
    const res = await tryber.tables.WpAppqEvdCampaign.do()
      .select(
        tryber.fn.charDate("start_date"),
        tryber.fn.charDate("end_date"),
        tryber
          .ref("name")
          .withSchema("wp_appq_campaign_type")
          .as("campaign_type")
      )
      .join(
        "wp_appq_campaign_type",
        "wp_appq_campaign_type.id",
        "wp_appq_evd_campaign.campaign_type_id"
      )
      .where("wp_appq_evd_campaign.id", this.campaignId)
      .first();

    if (!res) {
      throw new Error("Campaign not found");
    }

    const capacity = await this.getFreeSpots();
    return {
      content: await this.getContent(),
      campaignType: res.campaign_type,
      startDate: res.start_date,
      endDate: res.end_date,
      status: await this.getStatus(),
      tl: {
        name: config.testerLeaderCPV2.name,
        email: config.testerLeaderCPV2.email,
      },
      ...(capacity.cap > 0
        ? { value: capacity.cap, freeSpots: capacity.freeSpots }
        : {}),
    };
  }

  private async getContent() {
    const res = await tryber.tables.CampaignPreviews.do()
      .select(tryber.ref("content").withSchema("campaign_previews"))
      .join(
        "wp_appq_evd_campaign",
        "wp_appq_evd_campaign.id",
        "campaign_previews.campaign_id"
      )
      .where("campaign_id", this.campaignId)
      .first();

    if (!res) {
      return "";
    }
    return res.content;
  }

  private async getStatus() {
    const application = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select("accepted")
      .where("user_id", this.getWordpressId())
      .where("campaign_id", this.campaignId)
      .first();

    if (!application) return "available" as const;
    if (application.accepted === 1) return "selected" as const;
    if (application.accepted === -1) return "excluded" as const;
    return "applied" as const;
  }

  private async getFreeSpots() {
    const applicationSpots = await tryber.tables.WpAppqEvdCampaign.do()
      .select(
        tryber
          .ref("desired_number_of_testers")
          .withSchema("wp_appq_evd_campaign")
          .as("cap")
      )
      .where("id", this.campaignId)
      .first();

    if (!applicationSpots) return { cap: 0, freeSpots: 0 };

    const cap = applicationSpots.cap;

    const validApplications = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select("campaign_id")
      .count({
        count: "user_id",
      })
      .whereNot("accepted", -1)
      .where("campaign_id", this.campaignId);

    const count = validApplications[0]?.count
      ? Number(validApplications[0].count)
      : 0;

    return {
      cap: 0,
      freeSpots: cap - count,
    };
  }
}

export default GetCampaignPreviewV2;
