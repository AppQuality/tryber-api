/** OPENAPI-ROUTE: get-users-me-rank-list */
import { Context } from "openapi-backend";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  const leaderboard: StoplightComponents["schemas"]["RankingItem"][] = [
    {
      position: 1,
      image: "https://placekitten.com/200/200",
      name: "John D.",
      id: 1,
      monthly_exp: 100,
    },
    {
      position: 2,
      image: "https://placekitten.com/200/200",
      name: "John D.",
      id: 1,
      monthly_exp: 100,
    },
    {
      position: 3,
      image: "https://placekitten.com/200/200",
      name: "John D.",
      id: 1,
      monthly_exp: 100,
    },
  ];
  res.status_code = 200;
  return {
    tops: leaderboard.slice(0, 3),
    peers: [],
  };
};
