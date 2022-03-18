/**  OPENAPI-ROUTE : get-users-me-payments */
import * as db from "@src/features/db";
import debugMessage from "@src/features/debugMessage";
import { Context } from "openapi-backend";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const params = {
      ...req.query,
      start:
        req.query.start && typeof req.query.start === "string"
          ? parseInt(req.query.start)
          : undefined,
      limit:
        req.query.limit && typeof req.query.limit === "string"
          ? parseInt(req.query.limit)
          : undefined,
    } as StoplightOperations["get-users-me-payments"]["parameters"]["query"];

    let pagination = ``;
    params.limit
      ? (pagination += `LIMIT ` + params.limit)
      : (pagination += `LIMIT 25`);
    params.start
      ? (pagination += ` OFFSET ` + params.start)
      : (pagination += ``);

    const WHERE = `WHERE pr.tester_id = ? AND 
    ( pr.iban IS NOT NULL AND pr.paypal_email IS NULL) OR 
    (pr.iban IS NULL AND pr.paypal_email IS NOT NULL)`;

    let total = undefined;
    if (params.limit) {
      const countSql = `SELECT COUNT(pr.id) as total
    FROM wp_appq_payment_request pr 
      ${WHERE}`;
      let countResults = await db.query(
        db.format(countSql, [req.user.testerId])
      );
      total = countResults[0].total ?? undefined;
    }
    const querySql = `
      SELECT 
      pr.id, pr.is_paid, pr.amount, pr.paypal_email, pr.iban,
      CASE 
        WHEN pr.is_paid=0 THEN NOW()
          ELSE pr.update_date 
      END as paidDate, 
        rcpt.url AS receipt
      FROM wp_appq_payment_request pr
             LEFT JOIN wp_appq_receipt rcpt ON pr.receipt_id = rcpt.id 
    ${WHERE} 
    ORDER BY ${params.orderBy || "paidDate"} 
    ${params.order || "DESC"} 
    ${pagination}
    `;
    const results = await db.query(db.format(querySql, [req.user.testerId]));
    const c = {
      results: results.map((row: any) => {
        return {
          id: row.id,
          status: row.is_paid === 0 ? "processing" : "paid",
          amount: {
            value: row.amount,
            currency: "EUR",
          },
          paidDate:
            row.is_paid === 0
              ? "-"
              : new Date(row.paidDate).toISOString().substring(0, 10),
          method: {
            type: !row.paypal_email ? "iban" : "paypal",
            note: !row.paypal_email
              ? "Iban ************" +
                row.iban.substr(-Math.min(row.iban.length - 1, 6))
              : row.paypal_email,
          },
          receipt: row.receipt ?? undefined,
        };
      }),
      limit: params.limit ?? undefined,
      size: results.length ?? 0,
      start: params.start ?? 0,
      total: total,
    };
    res.status_code = 200;

    return c;
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
