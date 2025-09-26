/** OPENAPI-CLASS: delete-users-me-campaigns-campaignId-tasks-taskId-media-mediaId */

import { tryber } from "@src/features/database";
import Campaigns, { CampaignObject } from "@src/features/db/class/Campaigns";
import PageAccess from "@src/features/db/class/PageAccess";
import deleteFromS3 from "@src/features/deleteFromS3";
import UserRoute from "@src/features/routes/UserRoute";

type SuccessType =
  StoplightOperations["delete-users-me-campaigns-campaignId-tasks-taskId-media-mediaId"]["responses"]["200"]["content"]["application/json"];

class DeleteMediaRoute extends UserRoute<{
  response: SuccessType;
  parameters: StoplightOperations["delete-users-me-campaigns-campaignId-tasks-taskId-media-mediaId"]["parameters"]["path"];
}> {
  private campaignId: number;
  private campaign: CampaignObject | false = false;
  private taskId: number;
  private mediaId: number;

  private db: {
    campaigns: Campaigns;
    pageAccess: PageAccess;
  };

  constructor(options: DeleteMediaRoute["configuration"]) {
    super(options);
    const parameters = this.getParameters();
    this.campaignId = parseInt(parameters.campaignId);
    this.taskId = parseInt(parameters.taskId);
    this.mediaId = parseInt(parameters.mediaId);
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

    if (await this.isMediaNotAccessibleOrNotExist()) {
      this.setError(404, new Error("Media not found") as OpenapiError);
      return false;
    }

    return true;
  }

  protected async prepare() {
    try {
      await this.deleteMedia();

      this.setSuccess(200, {});
    } catch (e) {
      this.setError(400, new Error("Error deleting media") as OpenapiError);
      return;
    }
  }

  private async hasAccess() {
    if (this.isNotAdmin() === false) return true;

    if (await this.testerIsNotSelected()) {
      return false;
    }
    return true;
  }

  private async testerIsNotSelected() {
    const access = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select()
      .where("campaign_id", this.campaignId)
      .where("accepted", 1)
      .andWhere("user_id", this.getWordpressId())
      .first();
    if (!access) return true;
    return false;
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

  private async isMediaNotAccessibleOrNotExist() {
    if (!this.mediaId || isNaN(this.mediaId)) return true;

    const results = await tryber.tables.WpAppqUserTaskMedia.do()
      .select(tryber.ref("id").withSchema("wp_appq_user_task_media"))
      .where("wp_appq_campaign_task.campaign_id", this.campaignId)
      .andWhere("wp_appq_user_task_media.campaign_task_id", this.taskId)
      .andWhere("wp_appq_user_task_media.tester_id", this.getTesterId())
      .where("wp_appq_user_task_media.id", this.mediaId)
      .join(
        "wp_appq_campaign_task",
        "wp_appq_campaign_task.id",
        "wp_appq_user_task_media.campaign_task_id"
      )
      .first();

    if (!results) return true;
    return false;
  }

  /**
   * Deletes a specific media item associated with a campaign task for the authenticated tester.
   */
  private async deleteMedia() {
    try {
      const media = await tryber.tables.WpAppqUserTaskMedia.do()
        .select("location")
        .where("id", this.mediaId)
        .andWhere("campaign_task_id", this.taskId)
        .andWhere("tester_id", this.getTesterId())
        .first();

      if (!media) {
        throw new Error("Media not found");
      }

      await deleteFromS3({ url: media.location });
      await tryber.tables.WpAppqUserTaskMedia.do()
        .where("id", this.mediaId)
        .andWhere("campaign_task_id", this.taskId)
        .andWhere("tester_id", this.getTesterId())
        .delete();
    } catch (error) {
      throw new Error("Error deleting media");
    }
  }
}

export default DeleteMediaRoute;
