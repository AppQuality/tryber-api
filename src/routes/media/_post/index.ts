import debugMessage from "@src/features/debugMessage";
import upload from "@src/features/upload";
import { Context } from "openapi-backend";
import path from "path";

/** OPENAPI-ROUTE: post-media */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    if (!req.files.media) {
      throw new Error("No file was uploaded");
    }
    const files = Array.isArray(req.files.media)
      ? req.files.media
      : [req.files.media];

    res.status_code = 200;
    return await uploadFiles(files, req.user.testerId);
  } catch (err) {
    debugMessage(err);
    res.status_code = 404;
    return {
      element: "media-upload",
      id: 0,
      message: (err as OpenapiError).message,
    };
  }

  function getKey({
    testerId,
    filename,
    extension,
  }: {
    testerId: number;
    filename: string;
    extension: string;
  }): string {
    return `${
      process.env.MEDIA_FOLDER || "media"
    }/T${testerId}/${filename}_${new Date().getTime()}${extension}`;
  }

  function isAcceptableFile(file: UploadedFile): boolean {
    return ![".bat", ".sh", ".exe"].includes(path.extname(file.name));
  }

  async function uploadFiles(
    files: UploadedFile[],
    testerId: number
  ): Promise<
    StoplightOperations["post-media"]["responses"]["200"]["content"]["application/json"]
  > {
    let uploadedFiles = [];
    let failedFiles = [];
    for (const media of files) {
      if (!isAcceptableFile(media) || isOversizedFile(media))
        failedFiles.push({ name: media.name });
      else {
        uploadedFiles.push({
          id: media.id,
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
    }
    return {
      files: uploadedFiles,
      failed: failedFiles.length ? failedFiles : undefined,
    };
  }
};
function isOversizedFile(media: UploadedFile): boolean {
  return media.size > parseInt(process.env.MAX_FILE_SIZE || "536870912");
}
