import { tryber } from "@src/features/database";
import * as db from "@src/features/db";

export default async (id: string) => {
  /*let sql = `SELECT e.id,e.display_name as name
    FROM wp_appq_evd_profile p
    JOIN wp_appq_employment e ON (e.id = p.employment_id)
    WHERE wp_user_id = ?;
  `;*/

  try {
    //const data = await db.query(db.format(sql, [id]));

    const data = await tryber.tables.WpAppqEvdProfile.do()
      .select("e.id", "e.display_name as name")
      .join(
        "wp_appq_employment as e",
        "wp_appq_employment.id",
        "wp_appq_evd_profile.employment_id"
      )
      .where("wp_appq_evd_profile.id", id);

    if (!data.length) throw Error("Invalid employement data");
    console.log("🚀 ~ file: getProfessionData.ts:22 ~ data:", data);
    return { profession: data[0] };
  } catch (e) {
    throw e;
  }
};
