import * as db from '../../../../features/db';

export default async (id: string) => {
  let sql = `SELECT COUNT(id) AS approved_bugs
        FROM wp_appq_evd_bug b
        WHERE b.wp_user_id  = ?
        AND b.status_id = 2`;
  return db
    .query(db.format(sql, [id]))
    .then((data) => {
      if (!data.length) return Promise.reject(Error("Invalid bugs data"));
      return { approved_bugs: data[0].approved_bugs };
    })
    .catch((e) => {
      if (process.env && process.env.NODE_ENV === "development") {
        console.log(e);
      }
      return Promise.reject(Error(e));
    });
};
