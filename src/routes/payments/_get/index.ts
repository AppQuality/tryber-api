/** OPENAPI-ROUTE: get-payments */
import * as db from "@src/features/db";
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
  const query =
    req.query as StoplightOperations["get-payments"]["parameters"]["query"];
  const sql = `SELECT 
    t.id   as tester_id,
    t.name as tester_name,
    t.surname as tester_surname,
    p.id,
    p.amount,
    p.request_date,
    p.iban,
    p.paypal_email,
    p.update_date,
    p.error_message
  FROM wp_appq_payment_request p
  JOIN wp_appq_evd_profile t ON (t.id = p.tester_id) 
  ORDER BY p.id ${query.order || "ASC"}
  `;
  let results;
  try {
    results = await db.query(sql);
  } catch (err) {
    if (process.env && process.env.DEBUG) {
      console.log(err);
    }
    res.status_code = 502;
    return {
      element: "payments",
      id: 0,
      message: (err as OpenapiError).message,
    };
  }
  if (results.length === 0) {
    res.status_code = 404;
    return {
      element: "payments",
      id: 0,
      message: "No payments found",
    };
  }

  const payments = results.map((r: any) => {
    const type = r.paypal_email
      ? "paypal"
      : r.iban
      ? "transferwise"
      : "unknown";
    return {
      id: r.id,
      amount: {
        value: r.amount,
        currency: "EUR",
      },
      created: new Date(r.request_date).getTime().toString(),
      updated: r.update_date
        ? new Date(r.update_date).getTime().toString()
        : undefined,
      error: r.error_message ? r.error_message : undefined,
      type,
      tryber: {
        id: r.tester_id,
        name: r.tester_name,
        surname: r.tester_surname,
      },
    };
  });

  res.status_code = 200;
  return { items: payments };
};
