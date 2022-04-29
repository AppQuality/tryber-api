/** OPENAPI-ROUTE: get-users-me-rank-list */
import Leaderboard from "@src/features/leaderboard";
import { Context } from "openapi-backend";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  const leaderboard = new Leaderboard(10);
  const result = await leaderboard.getLeaderboard();
  res.status_code = 200;
  return {
    tops: result.slice(0, 3),
    peers: [],
  };
};
