/** OPENAPI-ROUTE: get-payments */
import * as db from "@src/features/db";
import { Context } from "openapi-backend";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  const user = req.user;
  const query =
    req.query as StoplightOperations["get-payments"]["parameters"]["query"];

  if (user.role !== "administrator") {
    res.status_code = 403;
    return {
      element: "payments",
      id: 0,
      message: "You cannot retrieve payments",
    };
  }
  if (query.orderBy == "updated" && query.status != "failed") {
    res.status_code = 400;
    return {
      element: "payments",
      id: 0,
      message:
        "You cannot order payments by update date with status different by failed",
    };
  }

  const sql = `SELECT 
    t.id   as tester_id,
    t.name as tester_name,
    t.surname as tester_surname,
    p.id as id, 
    p.amount,
    p.request_date as created,
    p.iban,
    p.paypal_email,
    p.update_date,
    p.error_message
  FROM wp_appq_payment_request p
  JOIN wp_appq_evd_profile t ON (t.id = p.tester_id) 
  ORDER BY ${query.orderBy || "p.id"} ${query.order || "ASC"}
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
      created: new Date(r.created).getTime().toString(),
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
