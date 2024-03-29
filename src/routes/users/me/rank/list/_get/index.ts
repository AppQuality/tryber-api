/** OPENAPI-ROUTE: get-users-me-rank-list */

import { tryber } from "@src/features/database";
import * as db from "@src/features/db";
import Leaderboard from "@src/features/leaderboard";
import { imageUrl } from "@src/features/leaderboard/imageUrl";
import { Context } from "openapi-backend";

function getPeers(
  leaderboard: { id: number; position: number }[],
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
  const myLevel = await db.query(
    db.format(
      "SELECT level_id FROM wp_appq_activity_level WHERE tester_id = ?",
      [req.user.testerId]
    )
  );
  if (!myLevel.length) {
    res.status_code = 404;
    return {
      element: "rank",
      id: 0,
      message: "You are not ranked yet",
    };
  }
  const myLevelId = myLevel[0].level_id;
  const leaderboard = new Leaderboard(myLevelId);
  const result = await leaderboard.getLeaderboard();
  const myRank = leaderboard.getRankByTester(req.user?.testerId);
  if (!myRank) {
    res.status_code = 404;
    return {
      element: "rank",
      message: "You are not ranked",
    };
  }

  const tops = result.slice(0, 3);
  const peers = getPeers(result, myRank.position);

  const users = (
    await tryber.tables.WpAppqEvdProfile.do()
      .select("id", "name", "surname", "email")
      .whereIn(
        "id",
        [...tops, ...peers].map((user) => user.id)
      )
  ).map((user) => {
    return {
      ...user,
      name: user.name
        .toLowerCase()
        .replace(/[\W_]+/g, " ")
        .replace(" ", "-"),
      surname: user.surname
        .toLowerCase()
        .replace(/[\W_]+/g, " ")
        .replace(" ", "-")
        .charAt(0),
    };
  });

  res.status_code = 200;
  return {
    tops: tops.map((user) => {
      const u = users.find((u) => u.id === user.id);
      return {
        ...user,
        image: u
          ? imageUrl({
              name: u.name,
              surname: u.surname,
              email: u.email,
            })
          : "",
      };
    }),
    peers: peers.map((user) => {
      const u = users.find((u) => u.id === user.id);
      return {
        ...user,
        image: u
          ? imageUrl({
              name: u.name,
              surname: u.surname,
              email: u.email,
            })
          : "",
      };
    }),
  };
};
