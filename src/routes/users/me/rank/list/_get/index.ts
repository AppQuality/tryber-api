/** OPENAPI-ROUTE: get-users-me-rank-list */
import Leaderboard from "@src/features/leaderboard";
import { Context } from "openapi-backend";

function getPeers(
  leaderboard: StoplightComponents["schemas"]["RankingItem"][],
  position: number
) {
  if ([1, 2, 3, 4].includes(position)) {
    return leaderboard.slice(0, 9);
  }
  if (
    [
      leaderboard.length,
      leaderboard.length - 1,
      leaderboard.length - 2,
      leaderboard.length - 3,
    ].includes(position)
  ) {
    return leaderboard.slice(-9);
  }
  return leaderboard.slice(position - 4 - 1, position + 4);
}

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  const leaderboard = new Leaderboard(10);
  const result = await leaderboard.getLeaderboard();
  const myRank = leaderboard.getRankByTester(req.user?.testerId);
  if (!myRank) {
    res.status_code = 404;
    return {
      element: "rank",
      message: "You are not ranked",
    };
  }

  res.status_code = 200;
  return {
    tops: result.slice(0, 3),
    peers: getPeers(result, myRank.position),
  };
};
