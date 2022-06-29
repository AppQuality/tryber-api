import debugMessage from "@src/features/debugMessage";
import upload from "@src/features/upload";
import { Context } from "openapi-backend";
import path from "path";
import fs from "fs";

const parseForm = async (req: OpenapiRequest): Promise<Media[]> => {
  return new Promise((resolve, reject) => {
    const form = req.busboy;
    const files: Media[] = []; // create an empty array to hold the processed files
    form.on("file", (field: any, readableStream: any, fileData: any) => {
      const filePath = path.join("./tmp", fileData.filename);
      const fstream = fs.createWriteStream(filePath);
      const readStream = fs.createReadStream(filePath);

      readableStream.on("data", (data: any) => {
        fstream.write(data);
      });
      readableStream.on("end", () => {
        files.push({
          stream: readStream,
          mimeType: fileData.mimeType,
          name: fileData.filename,
          size: fstream.bytesWritten,
          tmpPath: filePath,
        });
      });
    });
    form.on("error", (err: any) => {
      reject(err);
    });
    form.on("finish", () => {
      resolve(files);
    });
    req.pipe(form); // pipe the request to the form handler
  });
};

/** OPENAPI-ROUTE: post-media */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    if (!fs.existsSync("./tmp")) {
      fs.mkdirSync("./tmp");
    }
    const filesToUpload = await parseForm(req);
    console.log(filesToUpload);
    res.status_code = 200;
    return await uploadFiles(filesToUpload, req.user.testerId);
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
    return ![".bat", ".sh", ".exe"].includes(path.extname(file.name));
  }

  async function uploadFiles(
    files: Media[],
    testerId: number
  ): Promise<
    StoplightOperations["post-media"]["responses"]["200"]["content"]["application/json"]
  > {
    let uploadedFiles = [];
    let failedFiles = [];
    for (const media of files) {
      if (!isAcceptableFile(media))
        failedFiles.push({
          name: media.name,
          errorCode: "INVALID_FILE_EXTENSION",
        });
      if (isOversizedFile(media))
        failedFiles.push({ name: media.name, errorCode: "FILE_TOO_BIG" });
      else {
        const keyEnhancer = media.keyEnhancer ? media.keyEnhancer : getKey;
        uploadedFiles.push({
          name: media.name,
          path: (
            await upload({
              bucket: process.env.MEDIA_BUCKET || "",
              key: keyEnhancer({
                testerId: testerId,
                filename: path.basename(media.name, path.extname(media.name)),
                extension: path.extname(media.name),
              }),
              file: media,
            })
          ).toString(),
        });
      }
      fs.unlinkSync(media.tmpPath);
    }
    return {
      files: uploadedFiles,
      failed: failedFiles.length ? failedFiles : undefined,
    };
  }
};
function isOversizedFile(media: Media): boolean {
  return media.size > parseInt(process.env.MAX_FILE_SIZE || "536870912");
}
