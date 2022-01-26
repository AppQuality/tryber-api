/** OPENAPI-ROUTE: get-users-me */
import { Context } from "openapi-backend";
import getUserData from "./getUserData";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  let fields = req.query.fields ? req.query.fields.split(",") : false;
  try {
    const user = await getUserData(req.user.ID, fields);
    res.status_code = 200;
    user.role = req.user ? req.user.role : "tester";
    return user;
  } catch (e) {
    if (process.env && process.env.DEBUG) {
      console.log(e);
    }
    res.status_code = 404;
    return {
      element: "users",
      id: parseInt(req.user.ID),
      message: (e as OpenapiError).message,
    };
  }
};
