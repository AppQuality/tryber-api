import * as db from "@src/features/db";

export default async (testerId: number) => {
  let deleteSql = `DELETE FROM wp_appq_profile_has_lang WHERE profile_id = ? ;`;
  let deleted;
  try {
    deleted = await db.query(db.format(deleteSql, [testerId]));
    return { message: "Languages successfully removed", ok: true };
  } catch (e) {
    if (process.env && process.env.DEBUG) console.log(e);
    return Promise.reject(Error("Failed to remove user Languages"));
  }
};
