/** OPENAPI-ROUTE: post-users-me-campaigns-campaignId-media */

import busboyMapper from "@src/features/busboyMapper";
import { tryber } from "@src/features/database";
import debugMessage from "@src/features/debugMessage";
import upload from "@src/features/upload";
import { Context } from "openapi-backend";
import path from "path";
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

  const validFileExtensions = await getValidFileExtensions();
  const { valid, invalid } = await busboyMapper(req, (file) => {
    if (!validFileExtensions.length) {
      return false;
    }
    if (
      !validFileExtensions.includes(
        path.extname(file.name).toLowerCase().replace(".", "")
      )
    ) {
      return "INVALID_FILE_EXTENSION";
    }
    return false;
  });
  const result = {
    files: await uploadFiles(valid, req.user.testerId),
    failed: invalid.length ? invalid : undefined,
  };
  res.status_code = 200;
  return result;
  async function getValidFileExtensions() {
    const option = await tryber.tables.WpOptions.do()
      .select("option_value")
      .where("option_name", "options_appq_valid_upload_extensions")
      .first();
    const validFileExtensionsString = option?.option_value;
    const validFileExtensions: string[] = validFileExtensionsString
      ? validFileExtensionsString.split(",")
      : [];

    return validFileExtensions;
  }

  async function isCandidate() {
    const candidature = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select("user_id")
      .where("user_id", req.user.ID)
      .andWhere("campaign_id", campaignId);
    if (candidature.length === 0)
      throw Error("You are not selected for this campaign");
  }
  async function uploadFiles(files: Media[], testerId: number) {
    let uploadedFiles = [];
    for (const media of files) {
      const currentPath = (
        await upload({
          bucket: process.env.MEDIA_BUCKET || "",
          key: getKey({
            testerId: testerId,
            filename: path.basename(media.name, path.extname(media.name)),
            extension: path.extname(media.name),
          }),
          file: media,
        })
      ).toString();

      uploadedFiles.push({
        name: media.name,
        path: currentPath,
      });
      await createUploadedFile(
        currentPath,
        new Date().toISOString().split(".")[0].replace("T", " ")
      );
    }
    return uploadedFiles;
  }
  function getKey({
    testerId,
    filename,
    extension,
  }: {
    testerId: number;
    filename: string;
    extension: string;
  }) {
    return `${
      process.env.MEDIA_FOLDER || "media"
    }/T${testerId}/CP${campaignId}/bugs/${crypt(
      `${filename}_${new Date().getTime()}`
    )}${extension}`;
  }

  async function createUploadedFile(path: string, creationDate: string) {
    try {
      await tryber.tables.WpAppqUploadedMedia.do().insert({
        url: path,
        creation_date: creationDate,
      });
    } catch (e) {
      debugMessage(e);
    }
  }
};
