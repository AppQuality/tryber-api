/** OPENAPI-CLASS: post-users-me-campaigns-campaign-tasks-task */

import Campaign from "@src/features/class/Campaign";
import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import UserRoute from "@src/features/routes/UserRoute";

export default class PostCampaignTask extends UserRoute<{
  response: StoplightOperations["post-users-me-campaigns-campaign-tasks-task"]["responses"]["200"];
  parameters: StoplightOperations["post-users-me-campaigns-campaign-tasks-task"]["parameters"]["path"];
  body: StoplightOperations["post-users-me-campaigns-campaign-tasks-task"]["requestBody"]["content"]["application/json"];
}> {
  private campaignId = parseInt(this.getParameters().campaignId);
  private taskId = parseInt(this.getParameters().taskId);
  private payload = this.getBody();

  protected async filter(): Promise<boolean> {
    if (await this.testerIsNotCandidate()) return false;
    if (await this.campaignIsUnavailable()) return false;
    if (await this.taskIsUnavailable()) return false;

    return true;
  }

  private userTaskDoesNotExist = async () => {
    const userTask = await tryber.tables.WpAppqUserTask.do()
      .select("*")
      .where({
        tester_id: this.getTesterId(),
        task_id: this.taskId,
      })
      .first();

    if (!userTask) {
      return true;
    }

    return false;
  };

  private async createCompletedUserTask() {
    try {
      await tryber.tables.WpAppqUserTask.do().insert({
        tester_id: this.getTesterId(),
        task_id: this.taskId,
        is_completed: 1,
      });
    } catch (error) {
      console.error(error);
      this.setError(500, error as OpenapiError);
    }
  }

  private allUserTasksCompleted = async () => {
    const tasks = await tryber.tables.WpAppqCampaignTask.do()
      .select("id")
      .where("campaign_id", this.campaignId);

    const completedTasks = await tryber.tables.WpAppqUserTask.do()
      .where({
        tester_id: this.getTesterId(),
        is_completed: 1,
      })
      .whereIn(
        "task_id",
        tasks.map((t) => t.id)
      );

    const incompleteTasks = tasks.filter(
      (t) => !completedTasks.find((ct) => ct.task_id === t.id)
    );
    return incompleteTasks.length === 0;
  };

  private async taskIsUnavailable() {
    const task = await tryber.tables.WpAppqCampaignTask.do()
      .select("*")
      .where({
        id: this.taskId,
        campaign_id: this.campaignId,
      })
      .first();

    if (!task) {
      this.setError(403, new OpenapiError("This task does not exist"));
      return true;
    }

    return false;
  }

  private async campaignIsUnavailable() {
    const phaseType = await tryber.tables.WpAppqEvdCampaign.do()
      .join(
        "campaign_phase",
        "campaign_phase.id",
        "wp_appq_evd_campaign.phase_id"
      )
      .join(
        "campaign_phase_type",
        "campaign_phase_type.id",
        "campaign_phase.type_id"
      )
      .select("campaign_phase_type.name")
      .where("wp_appq_evd_campaign.id", this.campaignId)
      .first();

    if (!phaseType || phaseType.name === "unavailable") {
      this.setError(404, new OpenapiError("This campaign does not exist"));
      return true;
    }

    return false;
  }

  private async handleUserTasks() {
    if (await this.userTaskDoesNotExist()) {
      await this.createCompletedUserTask();
      return;
    }
    await this.updateUserTaskStatus();
  }

  protected async prepare() {
    const campaign = new Campaign(this.campaignId, false);
    if (!campaign)
      this.setError(403, new OpenapiError("Campaign does not exist"));

    // safety check but it should never happen
    if (this.payload.status !== "completed") {
      this.setError(403, new OpenapiError("Invalid status"));
      return;
    }

    try {
      await this.handleUserTasks();

      if (await this.allUserTasksCompleted()) {
        await this.completeCampaign();
      }
      this.setSuccess(200, {});
    } catch (error) {
      this.setError(500, error as OpenapiError);
    }
  }

  private async completeCampaign() {
    await tryber.tables.WpCrowdAppqHasCandidate.do()
      .update({
        results: 3,
      })
      .where({
        user_id: this.getWordpressId(),
        campaign_id: this.campaignId,
      });
  }

  private async testerIsNotCandidate() {
    const campaign = new Campaign(this.campaignId, false);

    if (
      !(await campaign.isUserCandidate(
        this.getWordpressId().toString(),
        false // always checks for cp candidature, also for admin users
      ))
    ) {
      this.setError(
        404,
        new OpenapiError("You are not selected for this campaign")
      );
      return true;
    }
    return false;
  }

  private async updateUserTaskStatus() {
    try {
      await tryber.tables.WpAppqUserTask.do()
        .update({
          is_completed: 1,
        })
        .where({
          tester_id: this.getTesterId(),
          task_id: this.taskId,
        });
    } catch (error) {
      this.setError(500, error as OpenapiError);
    }
  }
}
