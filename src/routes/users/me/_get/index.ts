/** OPENAPI-ROUTE: get-users-me */

import { Context } from "openapi-backend";

import getUserData from "./getUserData";
import updateLastActivity from "./updateLastActivity";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  let query =
    req.query as StoplightOperations["get-users-me"]["parameters"]["query"];
  let fields = query.fields ? query.fields.split(",") : false;
  try {
    await updateLastActivity(req.user.testerId);
  } catch (e) {}

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
