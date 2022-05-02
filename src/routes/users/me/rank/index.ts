import * as db from "@src/features/db";
import debugMessage from "@src/features/debugMessage";
import Leaderboard from "@src/features/leaderboard";
import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: get-users-me-rank */
type LevelDefinition = {
  id: number;
  name: string;
  reach_exp_pts: number;
  hold_exp_pts: number;
};
const noLevel = { id: 0, name: "No Level" };
async function getUserLevel(
  tester_id: number
): Promise<StoplightComponents["schemas"]["MonthlyLevel"]> {
  // get user level
  const query = `
    SELECT lvl.id AS id, lvl.name AS name
    FROM wp_appq_activity_level_definition AS lvl
             JOIN wp_appq_activity_level trblvl ON lvl.id = trblvl.level_id
    WHERE trblvl.tester_id = ? `;

  let userLevelData = await db.query(db.format(query, [tester_id]));
  if (!userLevelData.length) {
    return noLevel;
  }
  return userLevelData[0];
}

async function getPreviousLevel(
  tester_id: number
): Promise<StoplightComponents["schemas"]["MonthlyLevel"]> {
  // get previous user level
  const query = `
  SELECT lvl.id AS id, lvl.name AS name
  FROM wp_appq_activity_level_definition AS lvl
         JOIN wp_appq_activity_level_rev rev on lvl.id = rev.level_id
  WHERE rev.tester_id = ?
    AND MONTH(rev.start_date) = MONTH(NOW()) - 1
  ORDER BY start_date DESC
  LIMIT 1;`;

  let userLevelData = await db.query(db.format(query, [tester_id]));
  if (!userLevelData.length) {
    return noLevel;
  }
  return userLevelData[0];
}

async function getMonthlyPoints(tester_id: number): Promise<number> {
  // get monthly user exp points
  const query = `
  SELECT SUM(amount) AS points
  FROM wp_appq_exp_points
  WHERE tester_id = ? AND MONTH(creation_date) = MONTH(NOW()) ;`;

  let userMonthlyExpPoints = await db.query(db.format(query, [tester_id]));
  if (!userMonthlyExpPoints.length || !userMonthlyExpPoints[0].points) {
    return 0;
  }
  return userMonthlyExpPoints[0].points;
}

function getNextLevel(
  monthly_exp: number,
  definitions: LevelDefinition[],
  currentLevelDefinition: LevelDefinition
): LevelDefinition {
  const nextLevel = definitions.find(
    (level) =>
      monthly_exp >= level.reach_exp_pts && level.id > currentLevelDefinition.id
  );
  if (!nextLevel) {
    return currentLevelDefinition;
  }
  return getNextLevel(monthly_exp, definitions, nextLevel);
}

async function getLevelDefinitions(): Promise<LevelDefinition[]> {
  const query = `
  SELECT id, name, reach_exp_pts ,hold_exp_pts
    FROM wp_appq_activity_level_definition `;
  return await db.query(query);
}
async function getProspectLevel(
  monthly_exp: number,
  current_level: number
): Promise<any> {
  const definitions = await getLevelDefinitions();

  const currentLevelDefinition = definitions.find(
    (definition) => definition.id === current_level
  );
  if (!currentLevelDefinition) {
    return { level: noLevel };
  }
  if (monthly_exp < currentLevelDefinition.hold_exp_pts) {
    const previousLevel = definitions.find(
      (definition) => definition.id < currentLevelDefinition.id
    );
    if (previousLevel) {
      return { level: { id: previousLevel.id, name: previousLevel.name } };
    }
  }
  const nextLevel = getNextLevel(
    monthly_exp,
    definitions,
    currentLevelDefinition
  );
  return {
    level: {
      id: nextLevel.id,
      name: nextLevel.name,
    },
  };
}

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    const userLevel = await getUserLevel(req.user?.testerId);
    const leaderboard = new Leaderboard(userLevel.id);
    await leaderboard.getLeaderboard();
    const myRanking = leaderboard.getRankByTester(req.user?.testerId);
    const monthlyExp = await getMonthlyPoints(req.user?.testerId);
    res.status_code = 200;

    return {
      level: userLevel,
      previousLevel: await getPreviousLevel(req.user?.testerId),
      rank: myRanking?.position || 0,
      points: monthlyExp,
      prospect: await getProspectLevel(monthlyExp, userLevel.id),
    };
  } catch (err) {
    res.status_code = (err as OpenapiError).status_code || 500;
    debugMessage(err);
    return {
      message: (err as OpenapiError).message,
    };
  }
};
