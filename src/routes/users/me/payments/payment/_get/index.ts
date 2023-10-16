/** OPENAPI-ROUTE: get-users-me-payments-payment*/
import debugMessage from "@src/features/debugMessage";
import { Context } from "openapi-backend";
import * as db from "@src/features/db";
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
    const data = await getPaymentsFromQuery(
      req.user.testerId,
      parseInt(params.payment),
      query
    );
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
  const fiscalCategory = await getFiscalCategory();
  return {
    results: results.map((attribution) => {
      return {
        id: attribution.id,
        amount: {
          gross: {
            value: Number(parseFloat(`${attribution.amount}`).toFixed(2)),
            currency: "EUR",
          },
          ...(fiscalCategory === 1 && {
            net: {
              value: Number(
                parseFloat(`${attribution.amount * 0.8}`).toFixed(2)
              ),
              currency: "EUR",
            },
          }),
        },
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

  async function getFiscalCategory() {
    let fiscalCategory = 0;
    let fiscalSql = `SELECT 
  fp.fiscal_category from wp_appq_fiscal_profile as fp
  JOIN wp_appq_evd_profile as p ON (p.id = fp.tester_id)
  WHERE p.wp_user_id = ? AND fp.is_active = 1
`;
    const fiscal = await db.query(db.format(fiscalSql, [req.user.ID]));
    if (fiscal.length) {
      fiscalCategory = fiscal[0].fiscal_category;
    }
    return fiscalCategory;
  }
};
