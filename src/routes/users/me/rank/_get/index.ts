import debugMessage from "@src/features/debugMessage";
import Leaderboard from "@src/features/leaderboard";
import { Context } from "openapi-backend";

import getPreviousLevel from "./getPreviousLevel";
import getUserLevel from "./getUserLevel";
import getUserTotalExperience from "./getUserTotalExperience";
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
  let userLevel, leaderboard, myRanking, monthlyExp, previousLevel, totalExp;

  try {
    userLevel = await getUserLevel(req.user?.testerId);
    leaderboard = new Leaderboard(userLevel.id);
    await leaderboard.getLeaderboard();
    myRanking = leaderboard.getRankByTester(req.user?.testerId);
    monthlyExp = myRanking?.monthly_exp || 0;
    totalExp = await getUserTotalExperience(req.user?.testerId);
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
    const prospectData = new ProspectData(userLevel.id, monthlyExp, totalExp);
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
