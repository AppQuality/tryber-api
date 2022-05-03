import debugMessage from "@src/features/debugMessage";
import Leaderboard from "@src/features/leaderboard";
import { Context } from "openapi-backend";

import getMonthlyPoints from "./getMonthlyPoints";
import getPreviousLevel from "./getPreviousLevel";
import getUserLevel from "./getUserLevel";
import noLevel from "./noLevel";
import ProspectData from "./ProspectData";

/** OPENAPI-ROUTE: get-users-me-rank */

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
): Promise<
  | StoplightOperations["get-users-me-rank"]["responses"]["200"]["content"]["application/json"]
  | { message: string }
> => {
  let userLevel, leaderboard, myRanking, monthlyExp, previousLevel;

  try {
    userLevel = await getUserLevel(req.user?.testerId);
    leaderboard = new Leaderboard(userLevel.id);
    await leaderboard.getLeaderboard();
    myRanking = leaderboard.getRankByTester(req.user?.testerId);
    monthlyExp = await getMonthlyPoints(req.user?.testerId);
    previousLevel = await getPreviousLevel(req.user?.testerId);
  } catch (err) {
    res.status_code = (err as OpenapiError).status_code || 500;
    debugMessage(err);
    return {
      message: (err as OpenapiError).message,
    };
  }

  let prospect;
  try {
    const prospectData = new ProspectData(userLevel.id, monthlyExp);
    await prospectData.ready;
    prospect = prospectData.getProspectLevel();
  } catch {
    prospect = {
      level: noLevel,
    };
  }

  res.status_code = 200;
  return {
    level: userLevel,
    previousLevel: previousLevel,
    rank: myRanking?.position || 0,
    points: monthlyExp,
    prospect: prospect,
  };
};
