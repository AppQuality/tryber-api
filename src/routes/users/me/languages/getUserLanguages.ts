import * as db from "@src/features/db";

export default async (
  testerId: number
): Promise<{ id: string; name: string }[]> => {
  try {
    let sql = `SELECT l.id AS id, l.display_name AS name
  FROM wp_appq_profile_has_lang hl
           JOIN wp_appq_lang l ON hl.language_id = l.id
  WHERE profile_id = ? ;`;
    let rows = await db.query(db.format(sql, [testerId]));
    if (!rows.length) return [];
    return rows;
  } catch (error) {
    if (process.env && process.env.DEBUG) console.log(error);
    throw error;
  }
};
