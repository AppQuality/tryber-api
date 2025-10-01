/** OPENAPI-CLASS : post-campaigns-campaign-tasks */

import { tryber } from "@src/features/database";
import OpenapiError from "@src/features/OpenapiError";
import CampaignRoute from "@src/features/routes/CampaignRoute";

class PostUsecasesRoute extends CampaignRoute<{
  response: StoplightOperations["post-campaigns-campaign-tasks"]["responses"]["201"]["content"]["application/json"];
  parameters: StoplightOperations["post-campaigns-campaign-tasks"]["parameters"]["path"];
  body: StoplightOperations["post-campaigns-campaign-tasks"]["requestBody"]["content"]["application/json"];
}> {
  protected async filter() {
    if ((await super.filter()) === false) return false;

    if (this.hasNoAccess()) {
      this.setError(403, new OpenapiError("You are not authorized to do this"));
      return false;
    }

    return true;
  }

  protected async prepare(): Promise<void> {
    const taskId = await this.createNewTask();
    await this.createNewTaskGroup(taskId);
    return this.setSuccess(201, await this.getTaskById(taskId));
  }
  private async createNewTask() {
    const body = this.getBody();
    const allow_media =
      body.upload?.policy && ["optimize", "allow"].includes(body.upload?.policy)
        ? 1
        : 0;
    const res = await tryber.tables.WpAppqCampaignTask.do()
      .insert({
        campaign_id: this.cp_id,
        title: `${body.prefix ? `${body.prefix}: ` : ""}${body.title}`,
        simple_title: body.title,
        content: body.content,
        is_required: body.is_required ? 1 : 0,
        position: body.position ?? undefined,
        prefix: body.prefix ?? "",
        jf_code: "",
        jf_text: "",
        info: "",
        allow_media,
        optimize_media: body.upload?.policy === "optimize" ? 1 : 0,
        language: body.upload?.language ?? "it",
      })
      .returning("id");

    if (!res || res.length < 1) {
      this.setError(403, new OpenapiError("Error creating the task"));
    }

    const newTaskId = res[0].id ?? res[0];
    return newTaskId;
  }

  private async createNewTaskGroup(taskId: number) {
    const res = await tryber.tables.WpAppqCampaignTaskGroup.do()
      .insert({
        group_id: 0,
        task_id: taskId,
      })
      .returning("task_id");

    if (!res[0] || !res[0].task_id) {
      this.setError(403, new OpenapiError("Error creating the task group"));
    }
  }

  private async getTaskById(taskId: number) {
    const task = await tryber.tables.WpAppqCampaignTask.do()
      .select("id", "title", "content")
      .where("id", taskId)
      .first();
    if (!task) {
      this.setError(404, new OpenapiError("Task not found"));
      return;
    }

    return {
      id: task.id,
      title: task.title,
      content: task.content,
    };
  }

  private hasNoAccess() {
    if (this.isNotAdmin() === false) return false;
    if (this.hasAccessToCampaign(this.cp_id)) return false;

    return true;
  }
}

export default PostUsecasesRoute;
