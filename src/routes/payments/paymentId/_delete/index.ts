import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: delete-payments-paymentId */
export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  if (req.user.role !== "administrator") {
    res.status_code = 403;
    return {};
  }

  res.status_code = 200;
  return {};
};
