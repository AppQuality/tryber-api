/** OPENAPI-CLASS: get-users-me-campaigns-campaignId-tasks-taskId-media */

import UserRoute from "@src/features/routes/UserRoute";
import Campaigns, { CampaignObject } from "@src/features/db/class/Campaigns";
import PageAccess from "@src/features/db/class/PageAccess";
import { tryber } from "@src/features/database";

type SuccessType =
  StoplightOperations["get-users-me-campaigns-campaignId-tasks-taskId-media"]["responses"]["200"]["content"]["application/json"];

class GetCampaignMyCampaignTasksMedia extends UserRoute<{
  response: SuccessType;
  parameters: StoplightOperations["get-users-me-campaigns-campaignId-tasks-taskId-media"]["parameters"]["path"];
}> {
  private campaignId: number;
  private campaign: CampaignObject | false = false;
  private taskId: number;

  private db: {
    campaigns: Campaigns;
    pageAccess: PageAccess;
  };

  constructor(options: GetCampaignMyCampaignTasksMedia["configuration"]) {
    super(options);
    const parameters = this.getParameters();
    this.campaignId = parseInt(parameters.campaignId);
    this.taskId = parseInt(parameters.taskId);
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

    if (await this.isTaskNotAccessible()) {
      this.setError(403, new Error("Task not found") as OpenapiError);
      return false;
    }

    return true;
  }

  protected async prepare() {
    const mediaData = await this.getCampaignTasksMedia();
    this.setSuccess(200, mediaData);
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

  private async isTaskNotAccessible() {
    if (!this.taskId || isNaN(this.taskId)) return true;
    {
      try {
        const task = await tryber.tables.WpAppqCampaignTask.do()
          .select(tryber.ref("id").withSchema("wp_appq_campaign_task"))
          .where("wp_appq_campaign_task.id", this.taskId)
          .where("wp_appq_campaign_task.campaign_id", this.campaignId)
          .leftJoin(
            "wp_appq_user_task",
            "wp_appq_user_task.task_id",
            "wp_appq_campaign_task.id"
          )
          .where("wp_appq_user_task.tester_id", this.getTesterId())
          .first();

        if (!task) return true;
        return false;
      } catch (e) {
        this.campaign = false;
      }
    }
    return this.campaign;
  }

  /**
   * Retrieves campaign tasks media for the campaign
   * @returns Array of objects with media data of a specific campaign task
   */
  private async getCampaignTasksMedia() {
    const results = await tryber.tables.WpAppqUserTaskMedia.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_user_task_media"),
        tryber.ref("filename").withSchema("wp_appq_user_task_media"),
        tryber.ref("location").withSchema("wp_appq_user_task_media")
      )
      .where("wp_appq_campaign_task.campaign_id", this.campaignId)
      .andWhere("wp_appq_user_task_media.campaign_task_id", this.taskId)
      .andWhere("wp_appq_user_task_media.tester_id", this.getTesterId())
      .andWhere("wp_appq_campaign_task.allow_media", 1)
      .join(
        "wp_appq_campaign_task",
        "wp_appq_campaign_task.id",
        "wp_appq_user_task_media.campaign_task_id"
      );

    if (!results) {
      throw new Error("Campaign tasks not found");
    }

    return {
      items:
        results.length > 0
          ? results.map((item) => ({
              id: item.id,
              location: item.location,
              name: item.filename,
            }))
          : [],
    };
  }
}

export default GetCampaignMyCampaignTasksMedia;
