import * as db from "../../../../features/db";

export default async (id: string) => {
  let sql = `SELECT e.id,e.display_name as name
    FROM wp_appq_evd_profile p
    JOIN wp_appq_employment e ON (e.id = p.employment_id)
    WHERE wp_user_id = ?;
  `;

  return db
    .query(db.format(sql, [id]))
    .then((data) => {
      if (!data.length)
        return Promise.reject(Error("Invalid employement data"));
      return { profession: data[0] };
    })
    .catch((e) => {
      if (process.env && process.env.NODE_ENV === "development") {
        console.log(e);
      }
      return Promise.reject(Error(e));
    });
};
