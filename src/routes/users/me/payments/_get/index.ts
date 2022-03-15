/**  OPENAPI-ROUTE : get-users-me-payments */
import * as db from "@src/features/db";
import debugMessage from "@src/features/debugMessage";
import { Context } from "openapi-backend";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  res.status_code = 200;
  try {
    const query = `SELECT pr.*, rcpt.url AS receipt
    FROM wp_appq_payment_request pr
             JOIN wp_appq_receipt rcpt ON pr.receipt_id = rcpt.id
    WHERE pr.tester_id = ?`;
    const results = await db.query(db.format(query, [req.user.testerId]));
    //console.log(results);
    return {
      results: results.map((row: any) => {
        return {
          id: row.id,
          status: row.is_paid === 0 ? "processing" : "paid",
          amount: {
            value: row.amount,
            currency: "EUR",
          },
          paidDate: row.update_date.substring(0, 10),
          method: {
            type: !row.paypal_email ? "iban" : "paypal",
            note: !row.paypal_email ? "Iban " + row.iban : row.paypal_email,
          },
          receipt: row.receipt,
        };
      }),
    };
  } catch (err) {
    debugMessage(err);
    res.status_code = 400;
    return {
      element: "payment-requests",
      id: 0,
      message: (err as OpenapiError).message,
    };
  }
};
