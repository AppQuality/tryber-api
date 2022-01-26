import * as db from "../../../../features/db";

export default async (id: string) => {
  let sql = `SELECT e.id,e.display_name as name
    FROM wp_appq_evd_profile p
    JOIN wp_appq_employment e ON (e.id = p.employment_id)
    WHERE wp_user_id = ?;
  `;

  try {
    const data = await db.query(db.format(sql, [id]));

    if (!data.length) throw Error("Invalid employement data");
    return { profession: data[0] };
  } catch (e) {
    throw e;
  }
};
