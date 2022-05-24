import * as db from "@src/features/db";

import noLevel from "../noLevel";

export default async function getUserLevel(
  tester_id: number
): Promise<StoplightComponents["schemas"]["MonthlyLevel"]> {
  const userLevelData = await db.query(
    db.format(
      `
  SELECT lvl.id AS id, lvl.name AS name
  FROM wp_appq_activity_level_definition AS lvl
           JOIN wp_appq_activity_level trblvl ON lvl.id = trblvl.level_id
  WHERE trblvl.tester_id = ? `,
      [tester_id]
    )
  );
  if (!userLevelData.length) {
    return noLevel;
  }
  return userLevelData[0];
}
