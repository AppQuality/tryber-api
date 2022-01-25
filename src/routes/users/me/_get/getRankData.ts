import * as db from "../../../../features/db";

export default async (id: string) => {
  let sql = `SELECT rank
        FROM (SELECT wp_user_id, id, name, surname, total_exp_pts, @rownum := @rownum + 1 AS rank
              FROM wp_appq_evd_profile AS t, (SELECT @rownum := 0) AS r
              WHERE name <> 'Deleted User'
              ORDER BY total_exp_pts DESC) \`selection\`
        WHERE wp_user_id = ?`;
  try {
    const data = await db.query(db.format(sql, [id]));
    if (!data.length) return Promise.reject(Error("Invalid rank data"));
    return { rank: +data[0].rank > 1000 ? "N/A" : data[0].rank.toString() };
  } catch (e) {
    if (process.env && process.env.NODE_ENV === "development") {
      console.log(e);
    }
    return Promise.reject(Error("Invalid rank data"));
  }
};
