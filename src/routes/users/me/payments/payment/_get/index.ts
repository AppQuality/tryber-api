/** OPENAPI-ROUTE: get-users-me-payments-payment*/
import * as db from "@src/features/db";
import debugMessage from "@src/features/debugMessage";
import { Context } from "openapi-backend";

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

  let order = query.order || "DESC";
  let orderBy = query.orderBy || "date";
  let attributions: {
    id: number;
    amount: number;
    date: string;
    activity: string;
    type: string;
  }[];
  try {
    let pagination = ``;
    query.limit
      ? (pagination += `LIMIT ` + query.limit)
      : (pagination += `LIMIT 25`);
    query.start ? (pagination += ` OFFSET ` + query.start) : (pagination += ``);

    attributions = await db.query(
      db.format(
        `SELECT p.id, p.amount,p.creation_date as date,
        CONCAT("[CP-",cp.id,"] ",cp.title) as activity,
        wt.work_type as type
    FROM wp_appq_payment p
    JOIN wp_appq_evd_campaign cp ON p.campaign_id = cp.id
    JOIN wp_appq_payment_work_types wt ON p.work_type_id = wt.id
    WHERE request_id = ? 
    ORDER BY ${orderBy} ${order}, date DESC
    ${pagination}`,
        [params.payment]
      )
    );
    if (!attributions.length) {
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

  let results = attributions.map((attribution) => {
    return {
      id: attribution.id,
      amount: { value: attribution.amount, currency: "EUR" },
      date: new Date(attribution.date).toISOString().split("T")[0],
      activity: attribution.activity,
      type: attribution.type,
    };
  });

  res.status_code = 200;
  return {
    results,
    limit: query.limit ?? 25,
    size: results.length,
    start: query.start ?? 0,
  };
};
