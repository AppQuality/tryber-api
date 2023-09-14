import * as db from "@src/features/db";

export default async (id: string) => {
  let sql = `SELECT 
    SUM(req.amount_gross) as gross,
    SUM(req.amount) as net
    FROM wp_appq_payment_request req
    JOIN wp_appq_evd_profile p ON (p.id = req.tester_id)
    WHERE p.wp_user_id = ? AND is_paid = 1;
  `;

  const res = await db.query(db.format(sql, [id]));
  if (!res.length) {
    Promise.reject(Error("Invalid booty data"));
  }
  return {
    booty: {
      gross: {
        value: (res[0].gross as number) ?? 0,
        currency: "EUR",
      },
      net: {
        value: (res[0].net as number) ?? 0,
        currency: "EUR",
      },
    },
  };
};
