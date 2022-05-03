import * as db from "@src/features/db";

export default async function getLevelDefinitions(): Promise<
  LevelDefinition[]
> {
  return await db.query(`
  SELECT id, name, reach_exp_pts ,hold_exp_pts
    FROM wp_appq_activity_level_definition `);
}
