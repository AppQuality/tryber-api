import * as db from "@src/features/db";
import debugMessage from "@src/features/debugMessage";

export default async (id: number) => {
  try {
    const sql = db.format(
      `UPDATE wp_appq_evd_profile
      SET last_activity = NOW()
      WHERE id = ?;`,
      [id]
    );
    const res = await db.query(sql);
  } catch (e) {
    debugMessage(e);
    throw e;
  }
};
