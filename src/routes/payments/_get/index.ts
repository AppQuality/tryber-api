/** OPENAPI-ROUTE: get-payments */
import * as db from "@src/features/db";
import { Context } from "openapi-backend";

import getPaymentsFromQuery from "./getPaymentsFromQuery";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  const user = req.user;
  const query = {
    ...req.query,
    start:
      req.query.start && typeof req.query.start === "string"
        ? parseInt(req.query.start)
        : undefined,
    limit:
      req.query.limit && typeof req.query.limit === "string"
        ? parseInt(req.query.limit)
        : undefined,
  } as StoplightOperations["get-payments"]["parameters"]["query"];

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

  let totalPaymentsCounter;
  if (query.limit) {
    try {
      let WHERE = ``;
      if (query.status == `pending`)
        WHERE = `WHERE error_message IS NULL and is_paid = 0`;
      if (query.status == `failed`) WHERE = `WHERE error_message IS NOT NULL`;
      const sql = `SELECT COUNT(id) as total
    FROM wp_appq_payment_request
      ${WHERE}`;
      let res = await db.query(sql);
      totalPaymentsCounter = res[0].total;
    } catch (err) {
      if (process.env && process.env.DEBUG) {
        console.log(err);
      }
      res.status_code = 400;
      return {
        element: "payments",
        id: 0,
        message: (err as OpenapiError).message,
      };
    }
  }

  let results;
  try {
    results = await getPaymentsFromQuery(query);
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
  const payments = results.map((r) => {
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
      updated: r.updated ? new Date(r.updated).getTime().toString() : undefined,
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
  return {
    size: payments.length,
    start: query.start ? query.start : 0,
    limit: query.limit,
    total: totalPaymentsCounter,
    items: payments,
  };
};
