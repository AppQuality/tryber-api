/**  OPENAPI-ROUTE : get-users-me-payments */
import debugMessage from "@src/features/debugMessage";
import { Context } from "openapi-backend";

import getPaymentsFromQuery from "./getPaymentsFromQuery";

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

    let results, total;
    try {
      const data = await getPaymentsFromQuery(req.user.testerId, params);
      results = data.results;
      total = data.total;
    } catch (err) {
      debugMessage(err);
      res.status_code = 400;
      return {
        element: "payments",
        id: 0,
        message: (err as OpenapiError).message,
      };
    }

    if (!results.length) {
      res.status_code = 404;
      return {
        element: "payments",
        id: 0,
        message: "No payments requests until now",
      };
    }
    res.status_code = 200;
    return {
      results: results.map((row) => {
        const type = row.iban ? "iban" : "paypal";
        const note = row.iban
          ? "Iban ************" +
            row.iban.substr(-Math.min(row.iban.length - 1, 6))
          : row.paypal_email;
        return {
          id: row.id,
          status: row.is_paid === 0 ? "processing" : "paid",
          amount: {
            value: row.amount,
            currency: "EUR",
          },
          paidDate: row.is_paid === 0 ? "-" : row.paidDate.substring(0, 10),
          method: {
            type,
            note,
          },
          receipt: row.receipt ?? undefined,
        };
      }),
      limit: params.limit ?? 25,
      size: results.length,
      start: params.start ?? 0,
      total,
    };
  } catch (err) {
    debugMessage(err);
    res.status_code = 400;
    return {
      element: "payments",
      id: 0,
      message: (err as OpenapiError).message,
    };
  }
};
