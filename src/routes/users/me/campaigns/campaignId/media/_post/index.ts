/** OPENAPI-ROUTE: post-users-me-campaigns-campaignId-media */

import { tryber } from "@src/features/database";
import TaskMediaUploader from "@src/features/TaskMediaUploader";
import { Context } from "openapi-backend";
import crypt from "./crypt";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
): Promise<Result | ReturnErrorType> => {
  const { campaignId } = c.request.params as PathParameters;
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

  const uploader = new TaskMediaUploader({
    request: req,
    keyMaker: ({ testerId, filename, extension }) =>
      `${
        process.env.MEDIA_FOLDER || "media"
      }/T${testerId}/CP${campaignId}/bugs/${crypt(
        `${filename}_${new Date().getTime()}`
      )}${extension}`,
  });

  await uploader.init();
  const { valid, invalid } = await uploader.getValidInvalidFiles();
  const result = {
    files: await uploader.uploadFiles(valid, req.user.testerId),
    failed: invalid.length ? invalid : undefined,
  };
  res.status_code = 200;
  return result;

  async function isCandidate() {
    const candidature = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select("user_id")
      .where("user_id", req.user.ID)
      .andWhere("campaign_id", campaignId);
    if (candidature.length === 0)
      throw Error("You are not selected for this campaign");
  }
};
