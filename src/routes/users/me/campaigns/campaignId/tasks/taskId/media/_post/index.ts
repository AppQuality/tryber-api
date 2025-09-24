/** OPENAPI-ROUTE: post-users-me-campaigns-campaignId-tasks-taskId-media */

import { tryber } from "@src/features/database";
import TaskMediaUploader from "@src/features/TaskMediaUploader";
import { Context } from "openapi-backend";
import crypt from "./crypt";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
): Promise<Result | ReturnErrorType> => {
  const { campaignId, taskId } = c.request.params as PathParameters;
  const task = await tryber.tables.WpAppqCampaignTask.do()
    .select("id", "optimize_media", "campaign_id")
    .where("id", taskId)
    .first();

  if (!task || task.campaign_id !== parseInt(campaignId)) {
    res.status_code = 404;
    return {
      element: "task",
      id: parseInt(taskId),
      message: "Task not found",
    };
  }
  try {
    await isCandidate();
  } catch {
    res.status_code = 403;
    return {
      element: "campaign",
      id: parseInt(campaignId),
      message: "You are not allowed to upload media for this campaign",
    };
  }

  await tryber.tables.WpAppqUserTask.do()
    .insert({
      tester_id: req.user.testerId,
      task_id: Number(taskId),
      is_completed: 0,
    })
    .onConflict(["tester_id", "task_id"])
    .ignore();

  const userTask = await tryber.tables.WpAppqUserTask.do()
    .select("id")
    .where("tester_id", req.user.testerId)
    .andWhere("task_id", Number(taskId))
    .first();

  if (!userTask) {
    res.status_code = 500;
    return {
      element: "user_task",
      id: 0,
      message: "User task not found ",
    };
  }

  const uploader = new TaskMediaUploader({
    request: req,
    bucket:
      task.optimize_media === 1
        ? process.env.OPTIMIZED_TASK_MEDIA_BUCKET || ""
        : process.env.TASK_MEDIA_BUCKET || "",
    keyMaker: ({ testerId, filename, extension }) =>
      `CP${campaignId}/UC${taskId}/T${testerId}/${crypt(
        `${filename}_${new Date().getTime()}`
      )}${extension}`,
  });

  await uploader.init();
  const { valid, invalid } = await uploader.getValidInvalidFiles();
  const result = {
    files: await uploader.uploadFiles(valid, req.user.testerId),
    failed: invalid.length ? invalid : undefined,
  };

  for (const file of result.files) {
    await tryber.tables.WpAppqUserTaskMedia.do().insert({
      user_task_id: userTask.id,
      campaign_task_id: task.id,
      location: file.path,
      filename: file.name,
      tester_id: req.user.testerId,
    });
  }

  res.status_code = 200;
  return result;

  async function isCandidate() {
    const candidature = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select("user_id")
      .where("user_id", req.user.ID)
      .andWhere("campaign_id", campaignId)
      .andWhere("accepted", 1);
    if (candidature.length === 0)
      throw Error("You are not selected for this campaign");
  }
};
