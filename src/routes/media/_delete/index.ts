/** OPENAPI-ROUTE: delete-media */

import debugMessage from "@src/features/debugMessage";
import deleteFromS3 from "@src/features/deleteFromS3";
import { Context } from "openapi-backend";
import * as db from "@src/features/db";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  const { url } =
    req.body as StoplightOperations["delete-media"]["requestBody"]["content"]["application/json"];

  const bucket = process.env.MEDIA_BUCKET;
  if (!bucket) {
    res.status_code = 500;
    return {
      message: "Configuration error, contact your administrator",
    };
  }
  try {
    if (!isValidPath(url, "eu-west-1", bucket)) {
      throw new Error("Invalid path");
    }
  } catch (err) {
    debugMessage(err);
    res.status_code = 404;
    return {
      element: "delete-media",
      id: 0,
      message: "Bad file path",
    };
  }

  if (await mediaIsAlreadyLinked()) {
    res.status_code = 403;
    return {
      element: "delete-media",
      id: 0,
      message: "Bad file path",
    };
  }

  res.status_code = 200;
  await deleteFromS3({ url });
  return {};
  function isValidPath(path: string, region: string, bucket: string): boolean {
    return path.startsWith(
      `https://s3.${region}.amazonaws.com/${bucket}/${
        process.env.MEDIA_FOLDER || "media"
      }/T${req.user.testerId}/`
    );
  }
  async function mediaIsAlreadyLinked(): Promise<boolean> {
    const bugMedia = await db.query(
      db.format(`SELECT id FROM wp_appq_evd_bug_media WHERE location = ?`, [
        url,
      ])
    );
    return bugMedia.length > 0;
  }
};
