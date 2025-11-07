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

  uploader.pathStyle = true;

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
      size: file.size,
      tester_id: req.user.testerId,
      mimetype: file.mimetype,
      ...(await getSelectedDeviceData()),
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

  async function getSelectedDeviceData() {
    const mediaDevice = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select(
        tryber.ref("manufacturer").withSchema("wp_crowd_appq_device"),
        tryber.ref("model").withSchema("wp_crowd_appq_device"),
        tryber.ref("pc_type").withSchema("wp_crowd_appq_device"),
        tryber.ref("platform_id").withSchema("wp_crowd_appq_device"),
        tryber.ref("os_version_id").withSchema("wp_crowd_appq_device"),
        tryber.ref("form_factor").withSchema("wp_crowd_appq_device")
      )
      .join(
        "wp_crowd_appq_device",
        "wp_crowd_appq_device.id",
        "=",
        "wp_crowd_appq_has_candidate.selected_device"
      )
      .where("user_id", req.user.ID)
      .andWhere("campaign_id", campaignId)
      .andWhere("accepted", 1)
      .first();

    console.log(mediaDevice);
    if (mediaDevice) {
      return {
        manufacturer: mediaDevice.manufacturer,
        model: mediaDevice.model,
        pc_type: mediaDevice.pc_type,
        platform_id: mediaDevice.platform_id,
        os_version_id: mediaDevice.os_version_id,
        form_factor: mediaDevice.form_factor,
      };
    }

    return {
      manufacturer: "Unknown",
      model: "Unknown",
      pc_type: "Unknown",
      platform_id: 0,
      os_version_id: 0,
      form_factor: "Unknown",
    };
  }
};
