import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: post-users-me-bugs-media */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    //@ts-ignore
    console.log(req.files);
    res.status_code = 200;
    return {};
  } catch (error) {
    if (process.env && process.env.DEBUG) console.log(error);
    res.status_code = 404;
    return {
      element: "media-bugs",
      id: 0,
      message: (error as OpenapiError).message,
    };
  }
};
