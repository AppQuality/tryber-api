import * as db from "@src/features/db";

export default async (id: string) => {
  let sql = `SELECT e.id,e.display_name as name
    FROM wp_appq_evd_profile p
    JOIN wp_appq_education e ON (e.id = p.education_id)
    WHERE wp_user_id = ?;
  `;

  return db
    .query(db.format(sql, [id]))
    .then((data) => {
      if (!data.length) return Promise.reject(Error("Invalid education data"));
      return { education: data[0] };
    })
    .catch((e) => Promise.reject(Error(e)));
};
