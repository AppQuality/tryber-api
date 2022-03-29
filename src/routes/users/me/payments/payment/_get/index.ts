/** OPENAPI-ROUTE: get-users-me-payments-payment*/
import debugMessage from "@src/features/debugMessage";
import { Context } from "openapi-backend";
import getPaymentsFromQuery from "./getPaymentsFromQuery";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
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
  } as StoplightOperations["get-users-me-payments-payment"]["parameters"]["query"];

  let params = c.request
    .params as StoplightOperations["get-users-me-payments-payment"]["parameters"]["path"];

  let total, results;
  try {
    const data = await getPaymentsFromQuery(parseInt(params.payment), query);
    results = data.results;
    total = data.total;
    if (!results.length) {
      res.status_code = 404;
      return {
        element: "payment",
        id: parseInt(params.payment),
        message: "Payment not found",
      };
    }
  } catch (e) {
    res.status_code = 500;
    debugMessage(e);
    return {
      element: "payment",
      id: parseInt(params.payment),
      message: (e as OpenapiError).message,
    };
  }

  res.status_code = 200;
  return {
    results: results.map((attribution) => {
      return {
        id: attribution.id,
        amount: { value: attribution.amount, currency: "EUR" },
        date: new Date(attribution.date).toISOString().split("T")[0],
        activity: attribution.activity,
        type: attribution.type,
      };
    }),
    limit: query.limit ?? 25,
    size: results.length,
    start: query.start ?? 0,
    total,
  };
};
