import * as db from "@src/features/db";

import noLevel from "../noLevel";

export default async function getPreviousLevel(
  tester_id: number
): Promise<StoplightComponents["schemas"]["MonthlyLevel"]> {
  const previousMonthDate = new Date();
  previousMonthDate.setDate(1);
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
  const previousMonth = previousMonthDate.getMonth() + 1;

  // TODO: replace previous month with sql interval (NOW() - INTERVAL 1 MONTH)
  let userLevelData = await db.query(
    db.format(
      `
  SELECT lvl.id AS id, lvl.name AS name
  FROM wp_appq_activity_level_definition AS lvl
         JOIN wp_appq_activity_level_rev rev on lvl.id = rev.level_id
  WHERE rev.tester_id = ?
    AND MONTH(rev.start_date) = ?
  ORDER BY start_date DESC
  LIMIT 1;`,
      [tester_id, previousMonth]
    )
  );
  if (!userLevelData.length) {
    return noLevel;
  }
  return userLevelData[0];
}
