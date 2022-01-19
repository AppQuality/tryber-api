import * as db from '../../../../features/db';

export default async (id: string) => {
  let sql = `SELECT l.display_name as language, l.id as id
               FROM wp_appq_profile_has_lang pl
                   JOIN wp_appq_evd_profile p
               on pl.profile_id = p.id
                   JOIN wp_appq_lang l ON (pl.language_id = l.id)
               WHERE wp_user_id = ?;
    ;
    `;

  return db
    .query(db.format(sql, [id]))
    .then((data) => {
      if (!data.length) return Promise.reject(Error("Invalid language data"));
      return {
        languages: data.map((l: { id: string; language: string }) => ({
          id: l.id,
          name: l.language,
        })),
      };
    })
    .catch((e) => Promise.reject(Error(e)));
};
