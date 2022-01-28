import * as db from "@src/features/db";

export default async (wpId: string, value: "true" | "false") => {
  let emptyCertSql = `SELECT * FROM wp_usermeta 
    WHERE user_id = ? 
    AND meta_key = 'emptyCerts' ;`;
  let emptyCert;
  try {
    emptyCert = await db.query(db.format(emptyCertSql, [wpId]));
  } catch (e) {
    if (process.env && process.env.DEBUG) console.log(e);
    return Promise.reject(Error("Failed on finding emptyCerts"));
  }
  if (emptyCert.length) {
    // update
    try {
      let updateSql = `UPDATE wp_usermeta SET meta_value = ? WHERE user_id = ? AND meta_key = 'emptyCerts';`;
      return db.query(db.format(updateSql, [value, wpId]));
    } catch (e) {
      if (process.env && process.env.DEBUG) console.log(e);
      return Promise.reject(Error("Failed on update emptyCerts"));
    }
  } else {
    // insert
    try {
      let insertSql = `INSERT INTO wp_usermeta (meta_value, user_id, meta_key) VALUES (?,?,'emptyCerts');`;

      return db.query(db.format(insertSql, [value, wpId]));
    } catch (e) {
      if (process.env && process.env.DEBUG) console.log(e);
      return Promise.reject(Error("Failed on insert emptyCerts"));
    }
  }
};
