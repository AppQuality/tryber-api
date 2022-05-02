import * as db from "@src/features/db";
import debugMessage from "@src/features/debugMessage";
import { Context } from "openapi-backend";

/** OPENAPI-ROUTE: get-users-me-rank */

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
    throw { status_code: 404, message: "No Level for you" };
  }

  console.log(userLevelData);
  return userLevelData[0];
}

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    res.status_code = 200;
    return {
      level: await getUserLevel(req.user?.testerId),
      previousLevel: {
        id: 0,
        name: "shit",
      },
      rank: 0,
      points: 0,
      prospect: {
        level: {
          id: 2,
          name: "starter",
        },
      },
    };
  } catch (err) {
    res.status_code = (err as OpenapiError).status_code || 500;
    debugMessage(err);
    return {
      message: (err as OpenapiError).message,
    };
  }
};
