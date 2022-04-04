import * as db from "@src/features/db";
import debugMessage from "@src/features/debugMessage";
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
  let paymentId;
  try {
    paymentId = c.request.params.paymentId;
    if (typeof paymentId !== "string") {
      throw Error("Invalid payment query parameter");
    }
    let query = db.format(`DELETE FROM wp_appq_payment_request WHERE id = ?`, [
      paymentId,
    ]);
    const result = await db.query(query);
    if (result.changes === 1) {
      res.status_code = 200;
      return {};
    } else {
      res.status_code = 404;
      return {
        id: 0,
        message: "request id not found",
        element: "payment-request",
      };
    }
  } catch (err) {
    debugMessage(err);
    res.status_code = 504;
    return {};
  }
};
