import debugMessage from "@src/features/debugMessage";
import upload from "@src/features/upload";
import { Context } from "openapi-backend";
import path from "path";
import busboyMapper from "@src/features/busboyMapper";

/** OPENAPI-ROUTE: post-media */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const { valid, invalid } = await busboyMapper(req, (file) => {
      if (!isAcceptableFile(file)) {
        return "INVALID_FILE_EXTENSION";
      }
      return false;
    });
    res.status_code = 200;
    return {
      files: await uploadFiles(valid, req.user.testerId),
      failed: invalid.length ? invalid : undefined,
    };
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

  function isAcceptableFile(file: { name: string }): boolean {
    return ![".bat", ".sh", ".exe"].includes(
      path.extname(file.name).toLowerCase()
    );
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
    return uploadedFiles;
  }
};
