/** OPENAPI-ROUTE: get-users-me-rank-list */
import { Context } from "openapi-backend";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  res.status_code = 200;
  return {
    tops: [],
    peers: [],
  };
};
