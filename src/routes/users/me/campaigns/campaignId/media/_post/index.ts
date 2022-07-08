import * as db from "@src/features/db";
import { Context } from "openapi-backend";
import busboyMapper from "@src/features/busboyMapper";
import path from "path";
import crypt from "./crypt";
import upload from "@src/features/upload";
import debugMessage from "@src/features/debugMessage";
/** OPENAPI-ROUTE: post-users-me-campaigns-campaignId-media */
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
    const validFileExtensionsString = (
      await db.query(
        "SELECT option_value FROM wp_options WHERE option_name = 'options_appq_valid_upload_extensions'"
      )
    )[0].option_value;
    let validFileExtensions: string[] = [];
    if (validFileExtensionsString) {
      validFileExtensions = validFileExtensionsString.split(",");
    }
    return validFileExtensions;
  }

  async function isCandidate() {
    const candidature = await db.query(
      db.format(
        "SELECT * FROM wp_crowd_appq_has_candidate WHERE user_id = ? AND campaign_id = ?",
        [req.user.ID, campaignId]
      )
    );
    if (candidature.length === 0)
      throw Error("You are not selected for this campaign");
  }
  async function uploadFiles(
    files: Media[],
    testerId: number
  ): Promise<
    StoplightOperations["post-media"]["responses"]["200"]["content"]["application/json"]["files"]
  > {
    let uploadedFiles = [];
    for (const media of files) {
      uploadedFiles.push({
        name: media.name,
        path: (
          await upload({
            bucket: process.env.MEDIA_BUCKET || "",
            key: getKey({
              testerId: testerId,
              filename: path.basename(media.name, path.extname(media.name)),
              extension: path.extname(media.name),
            }),
            file: media,
          })
        ).toString(),
      });
    }
    for (const uploaded of uploadedFiles) {
      await createUploadedFile(
        uploaded.path,
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
      await db.query(
        db.format(
          `
        INSERT INTO wp_appq_uploaded_media (url, creation_date)
        VALUES (?, ?);`,
          [path, creationDate]
        )
      );
    } catch (e) {
      debugMessage(e);
      throw Error("Failed to insert uploaded media");
    }
  }
};
