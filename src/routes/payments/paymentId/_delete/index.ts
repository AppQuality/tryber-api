/** OPENAPI-ROUTE: delete-payments-paymentId */

import * as db from "@src/features/db";
import debugMessage from "@src/features/debugMessage";
import { Context } from "openapi-backend";

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
    let resCheckIsPaid = await db.query(
      db.format(`SELECT is_paid FROM wp_appq_payment_request WHERE id = ? `, [
        paymentId,
      ])
    );
    const isPaid = resCheckIsPaid[0]?.is_paid ?? false;
    if (isPaid) {
      res.status_code = 403;
      return {
        message:
          "the payment request is paid, you are not authorized to delete it",
      };
    }
    let query = db.format(
      `DELETE FROM wp_appq_payment_request WHERE id = ? AND is_paid = 0 `,
      [paymentId]
    );
    const resultDelete = await db.query(query);

    let updateAttributions = db.format(
      `UPDATE wp_appq_payment
        SET is_requested = 0 WHERE request_id = ? ;`,
      [paymentId]
    );
    const resultUpdate = await db.query(updateAttributions);

    if (resultDelete.affectedRows === 1 && resultUpdate.changedRows > 0) {
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
    res.status_code = 404;
    return {
      id: 0,
      message:
        "Error on deleting payment request. The request didn't eliminate.",
      element: "payment-request",
    };
  }
};
