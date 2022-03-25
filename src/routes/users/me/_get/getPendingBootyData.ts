import * as db from "@src/features/db";

export default async (id: string) => {
  let sql = `SELECT SUM(pay.amount) as total
    FROM wp_appq_payment pay
    JOIN wp_appq_evd_profile p ON (p.id = pay.tester_id)
    WHERE p.wp_user_id = ? AND is_requested = 0;
  `;

  const res = await db.query(db.format(sql, [id]));
  if (!res.length) {
    Promise.reject(Error("Invalid pending booty data"));
  }
  console.log(res);
  return { pending_booty: res[0].total ?? 0 };
};
