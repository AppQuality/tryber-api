import debugMessage from "@src/features/debugMessage";
import deleteFromS3 from "@src/features/deleteFromS3";
import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: delete-media */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    if (!req.body.url) {
      throw new Error("No url was provided");
    }
    if (
      !isS3Path(req.body.url, "eu-west-1", "tryber.assets.static") ||
      !isMyS3Folder(req.body.url)
    ) {
      throw new Error("Bad file path");
    }
    res.status_code = 200;
    return await deleteFromS3({ url: req.body.url });
  } catch (err) {
    debugMessage(err);
    res.status_code = 404;
    return {
      element: "delete-media",
      id: 0,
      message: (err as OpenapiError).message,
    };
  }

  function isS3Path(path: string, region: string, bucket: string): boolean {
    return path.startsWith(`https://s3.${region}.amazonaws.com/${bucket}/`);
  }

  function isMyS3Folder(path: string): boolean {
    return path.includes(`/T${req.user.testerId}/`);
  }
};
