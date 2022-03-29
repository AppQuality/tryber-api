/**  OPENAPI-ROUTE : get-users-me-pending-booty */
import debugMessage from "@src/features/debugMessage";
import { Context } from "openapi-backend";

import getPendBootiesFromQuery from "./getPendBootiesFromQuery";

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
    } as StoplightOperations["get-users-me-pending-booty"]["parameters"]["query"];

    let results, total;
    try {
      const data = await getPendBootiesFromQuery(req.user.testerId, params);
      results = data.results;
      total = data.total;
    } catch (err) {
      debugMessage(err);
      res.status_code = 400;
      return {
        element: "pending booty",
        id: 0,
        message: (err as OpenapiError).message,
      };
    }

    if (!results.length) {
      res.status_code = 404;
      return {
        element: "pending booty",
        id: 0,
        message: "No booty until now",
      };
    }
    res.status_code = 200;
    return {
      results: results.map((row) => {
        return {
          id: row.id,
          name: `[CP-${row.cpId}] ${row.cpName}`,
          amount: {
            value: row.amount,
            currency: "EUR",
          },
          attributionDate: row.attributionDate.substring(0, 10),
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
      element: "pending booty",
      id: 0,
      message: (err as OpenapiError).message,
    };
  }
};
