import * as db from "@src/features/db";

export default async (id: string) => {
  let sql = `
    SELECT COUNT(DISTINCT campaign_id) AS attended_cp 
      FROM wp_appq_exp_points pts
      JOIN wp_appq_evd_profile p ON (p.id = pts.tester_id)
      WHERE pts.activity_id = 1
        AND pts.amount > 0
        AND p.wp_user_id = ?;
  `;

  return db
    .query(db.format(sql, [id]))
    .then((data) => {
      if (!data.length) return Promise.reject(Error("Invalid cp data"));
      return { attended_cp: data[0].attended_cp };
    })
    .catch((e) => Promise.reject(Error(e)));
};
