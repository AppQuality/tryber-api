import * as db from "@src/features/db";

export default async (id: string) => {
  let sql = `SELECT c.id, c.name, c.area, c.institute, pc.achievement_date
    FROM wp_appq_profile_certifications pc
    JOIN wp_appq_evd_profile p ON (p.id = pc.tester_id)
    JOIN wp_appq_certifications_list c ON (c.id = pc.cert_id)
    WHERE p.wp_user_id = ?;`;

  try {
    const data = await db.query(db.format(sql, [id]));
    if (!data.length) {
      let emptyCertSql = `SELECT * FROM wp_usermeta 
          WHERE user_id = ? 
          AND meta_key = 'emptyCerts' AND meta_value = 'true';`;
      return db
        .query(db.format(emptyCertSql, [id]))
        .then((data) => {
          if (!data.length)
            return Promise.reject(Error("Invalid certification data"));
          return { certifications: false };
        })
        .catch((e) => Promise.reject(Error(e)));
    }
    return {
      certifications: data.map((d: { achievement_date: Date }) => {
        const item = {
          ...d,
          achievement_date: d.achievement_date.toISOString().substring(0, 10),
        };
        return item;
      }),
    };
  } catch (e) {
    if (process.env && process.env.DEBUG) console.log(e);
    return Promise.reject(e);
  }
};
