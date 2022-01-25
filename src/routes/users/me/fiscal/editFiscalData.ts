import * as db from '../../../../features/db';

export default async (testerId: number) => {
  let fiscal;
  const sql = `SELECT * 
    FROM wp_appq_fiscal_profile 
    WHERE tester_id = ? AND is_active = 1`;
  try {
    fiscal = await db.query(db.format(sql, [testerId]));
    if (!fiscal.length)
      return Promise.reject({ status_code: 404, message: "No fiscal profile" });
    return fiscal[0];
  } catch (e) {
    return Promise.reject(e);
  }
};
