/** OPENAPI-ROUTE: get-payments */
import { Context } from "openapi-backend";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  const user = req.user;
  if (user.role !== "administrator") {
    res.status_code = 403;
    return {
      element: "payments",
      id: 0,
      message: "You cannot retrieve payments",
    };
  }
  res.status_code = 200;
  return {};
};
