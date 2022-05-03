import * as db from "@src/features/db";

import noLevel from "../noLevel";

export default async function getPreviousLevel(
  tester_id: number
): Promise<StoplightComponents["schemas"]["MonthlyLevel"]> {
  let userLevelData = await db.query(
    db.format(
      `
  SELECT lvl.id AS id, lvl.name AS name
  FROM wp_appq_activity_level_definition AS lvl
         JOIN wp_appq_activity_level_rev rev on lvl.id = rev.level_id
  WHERE rev.tester_id = ?
    AND MONTH(rev.start_date) = MONTH(NOW()) - 1
  ORDER BY start_date DESC
  LIMIT 1;`,
      [tester_id]
    )
  );
  if (!userLevelData.length) {
    return noLevel;
  }
  return userLevelData[0];
}
