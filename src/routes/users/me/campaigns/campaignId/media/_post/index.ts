import * as db from "@src/features/db";
import postUserMedia from "@src/routes/media/_post";
import { Context } from "openapi-backend";
import path from "path";
import crypt from "./crypt";
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
  const media = Array.isArray(req.files.media)
    ? req.files.media
    : [req.files.media];

  const { valid, invalid } = await getInvalidExtensionMedia();
  req.files.media = valid;

  req.files.media = req.files.media.map((file) => {
    const enhancedFile: ApiUploadedFile = {
      ...file,
      keyEnhancer: ({ testerId, filename, extension }) => {
        return `${
          process.env.MEDIA_FOLDER || "media"
        }/T${testerId}/CP${campaignId}/bugs/${crypt(
          `${filename}_${new Date().getTime()}`
        )}${extension}`;
      },
    };
    return enhancedFile;
  });
  const basicMediaUpload = await postUserMedia(c, req, res);
  if (!userMediaHasResults(basicMediaUpload)) {
    return basicMediaUpload;
  }

  let failedMedia = !basicMediaUpload.failed
    ? []
    : basicMediaUpload.failed.map((value) => ({
        name: value.name,
        errorCode: "GENERIC_ERROR",
      }));
  failedMedia = [...failedMedia, ...invalid];

  return {
    ...basicMediaUpload,
    failed: failedMedia.length ? failedMedia : undefined,
  };

  async function getInvalidExtensionMedia() {
    const validFileExtensions = await getValidFileExtensions();
    if (!validFileExtensions.length) {
      return { valid: media, invalid: [] };
    }
    const validMedia: typeof media = [];
    const invalidFileExtensionMedia: {
      name: string;
      errorCode: "NOT_VALID_FILE_TYPE";
    }[] = [];
    media.forEach((item) => {
      if (
        validFileExtensions.includes(path.extname(item.name).replace(".", ""))
      ) {
        validMedia.push(item);
      } else {
        invalidFileExtensionMedia.push({
          name: item.name,
          errorCode: "NOT_VALID_FILE_TYPE",
        });
      }
    });

    return { valid: validMedia, invalid: invalidFileExtensionMedia };
  }
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
};

function userMediaHasResults(
  userMedia: Awaited<ReturnType<typeof postUserMedia>>
): userMedia is GenericMediaResult {
  return userMedia.hasOwnProperty("failed");
}
