import * as db from "../../../../features/db";

export default async (id: string) => {
  let sql = `SELECT COUNT(*) AS attended_cp
        FROM wp_crowd_appq_has_candidate c
        WHERE c.user_id  = ?
        AND c.accepted = 1
        AND c.results >= 2`;

  return db
    .query(db.format(sql, [id]))
    .then((data) => {
      if (!data.length) return Promise.reject(Error("Invalid cp data"));
      return { attended_cp: data[0].attended_cp };
    })
    .catch((e) => Promise.reject(Error(e)));
};
