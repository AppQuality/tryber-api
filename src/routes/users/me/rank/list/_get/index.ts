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
  const myRank = leaderboard.getRankByTester(req.user?.testerId);
  if (!myRank) {
    res.status_code = 404;
    return {
      element: "rank",
      message: "You are not ranked",
    };
  }
  let peers: StoplightComponents["schemas"]["RankingItem"][] = [];
  if ([1, 2, 3, 4].includes(myRank.position)) {
    peers = result.slice(0, 9);
  } else if (
    [
      result.length,
      result.length - 1,
      result.length - 2,
      result.length - 3,
    ].includes(myRank.position)
  ) {
    peers = result.slice(-9);
  } else {
    peers = result.slice(myRank.position - 4 - 1, myRank.position + 4);
  }

  res.status_code = 200;
  return {
    tops: result.slice(0, 3),
    peers: peers,
  };
};
