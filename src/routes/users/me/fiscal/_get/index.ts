/** OPENAPI-ROUTE:get-users-me-fiscal */
import { Context } from "openapi-backend";
import getByUser from "../getByUser";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    res.status_code = 200;
    return await getByUser(req.user.testerId);
  } catch (error) {
    if (process.env && process.env.DEBUG) {
      console.log(error);
    }
    res.status_code = (error as OpenapiError).status_code || 500;
    return {
      element: "users",
      id: parseInt(req.user.ID),
      message: (error as OpenapiError).message,
    };
  }
};
