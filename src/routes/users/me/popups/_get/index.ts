/** OPENAPI-ROUTE: get-users-me-popups */
import { Context } from "openapi-backend";
import getByUser from "../getByUser";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const showExpired = !!(
      req.query &&
      req.query.showExpired &&
      typeof req.query.showExpired === "string"
    );
    const popups = await getByUser(req.user.ID, showExpired);

    res.status_code = 200;
    return popups;
  } catch (error) {
    res.status_code = 404;
    return {
      element: "popups",
      id: 0,
      message: (error as OpenapiError).message,
    };
  }
};
