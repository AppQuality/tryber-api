/** OPENAPI-CLASS: get-users-me-campaign-campaignId-tasks */

import UserRoute from "@src/features/routes/UserRoute";
import Campaigns, { CampaignObject } from "@src/features/db/class/Campaigns";
import PageAccess from "@src/features/db/class/PageAccess";
import { tryber } from "@src/features/database";

type SuccessType =
  StoplightOperations["get-users-me-campaign-campaignId-tasks"]["responses"]["200"]["content"]["application/json"];

class GetCampaignMyCampaignTasks extends UserRoute<{
  response: SuccessType;
  parameters: StoplightOperations["get-users-me-campaign-campaignId-tasks"]["parameters"]["path"];
}> {
  private campaignId: number;
  private campaign: CampaignObject | false = false;

  private db: {
    campaigns: Campaigns;
    pageAccess: PageAccess;
  };

  constructor(options: GetCampaignMyCampaignTasks["configuration"]) {
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
    const taskData = await this.getFormattedTasks();
    this.setSuccess(200, taskData);
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

  /**
   * Retrieves campaign tasks for the campaign
   * @returns Array of objects with tasks data
   */
  private async retrieveCampaignTasks() {
    const results = await tryber.tables.WpAppqCampaignTask.do()
      .select(
        tryber.ref("id").withSchema("wp_appq_campaign_task"),
        "title",
        "content",
        "is_required",
        tryber.ref("is_completed").withSchema("wp_appq_user_task")
      )
      .where({ campaign_id: this.campaignId })
      .join(
        "wp_appq_user_task",
        "wp_appq_user_task.task_id",
        "wp_appq_campaign_task.id"
      );

    if (!results) {
      throw new Error("Campaign tasks not found");
    }

    return results;
  }

  private async getFormattedTasks() {
    const tasks = await this.retrieveCampaignTasks();
    return tasks.map((task) => ({
      id: task.id,
      name: task.title || "",
      is_required: task.is_required === 1 ? 1 : 0,
      content: task.content || "",
      status:
        task.is_completed === 1 ? ("completed" as const) : ("pending" as const),
    }));
  }
}

export default GetCampaignMyCampaignTasks;
