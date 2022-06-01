import debugMessage from "@src/features/debugMessage";
import deleteFromS3 from "@src/features/deleteFromS3";
import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: delete-media */
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
    res.status_code = 200;
    await deleteFromS3({ url });
    return {};
  } catch (err) {
    debugMessage(err);
    res.status_code = 404;
    return {
      element: "delete-media",
      id: 0,
      message: "Bad file path",
    };
  }

  function isValidPath(path: string, region: string, bucket: string): boolean {
    return path.startsWith(
      `https://s3.${region}.amazonaws.com/${bucket}/${
        process.env.MEDIA_FOLDER || "media"
      }/T${req.user.testerId}/`
    );
  }
};
