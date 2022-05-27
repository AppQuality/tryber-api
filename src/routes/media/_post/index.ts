import debugMessage from "@src/features/debugMessage";
import upload from "@src/features/upload";
import { UploadedFile } from "express-fileupload";
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
      element: "media-bugs",
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
    return `media/T${testerId}/${filename}}_${new Date().getTime()}${extension}`;
  }

  async function uploadFiles(
    files: UploadedFile[],
    testerId: number
  ): Promise<
    StoplightOperations["post-media"]["responses"]["200"]["content"]["application/json"]
  > {
    let uploadedFiles = [];
    for (const media of files) {
      uploadedFiles.push(
        (
          await upload({
            bucket: `tryber.assets.static`,
            key: getKey({
              testerId: testerId,
              filename: path.basename(media.name, path.extname(media.name)),
              extension: path.extname(media.name),
            }),
            file: media,
          })
        ).toString()
      );
    }
    return uploadedFiles;
  }
};
