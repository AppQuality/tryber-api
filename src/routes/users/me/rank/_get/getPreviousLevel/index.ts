import { tryber } from "@src/features/database";
import noLevel from "../noLevel";

export default async function getPreviousLevel(
  tester_id: number
): Promise<StoplightComponents["schemas"]["MonthlyLevel"]> {
  const previousMonthDate = new Date();
  previousMonthDate.setDate(1);
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
  const previousMonth = previousMonthDate.getMonth() + 1;

  // TODO: replace previous month with sql interval (NOW() - INTERVAL 1 MONTH)
  const userLevelDataQ = tryber.tables.WpAppqActivityLevelDefinition.do()
    .select(
      tryber.ref("id").withSchema("wp_appq_activity_level_definition"),
      tryber.ref("name").withSchema("wp_appq_activity_level_definition"),
      tryber.raw(
        `${tryber.fn.month("wp_appq_activity_level_rev.start_date")} as month`
      )
    )
    .join(
      "wp_appq_activity_level_rev",
      "wp_appq_activity_level_rev.level_id",
      "wp_appq_activity_level_definition.id"
    )
    .where("wp_appq_activity_level_rev.tester_id", tester_id);

  const userLevelData = (await userLevelDataQ).filter((data) => {
    return Number((data as any).month) == previousMonth;
  });

  if (!userLevelData.length) {
    return noLevel;
  }
  return { id: userLevelData[0].id, name: userLevelData[0].name };
}
