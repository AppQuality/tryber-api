import * as db from "@src/features/db";

export default async (id: string) => {
  let fiscalCategory = 0;

  let fiscalSql = `SELECT 
  fp.fiscal_category from wp_appq_fiscal_profile as fp
  JOIN wp_appq_evd_profile as p ON (p.id = fp.tester_id)
  WHERE p.wp_user_id = ? AND fp.is_active = 1
`;
  const fiscal = await db.query(db.format(fiscalSql, [id]));
  if (fiscal.length) {
    fiscalCategory = fiscal[0].fiscal_category;
  }
  let sql = `SELECT SUM(pay.amount) as total
    FROM wp_appq_payment pay
    JOIN wp_appq_evd_profile p ON (p.id = pay.tester_id)
    WHERE p.wp_user_id = ? AND is_requested = 0 AND is_paid = 0;
  `;
  const res = await db.query(db.format(sql, [id]));
  if (!res.length) {
    Promise.reject(Error("Invalid pending booty data"));
  }
  return {
    pending_booty: {
      gross: {
        value: res[0].total ? Number(parseFloat(res[0].total).toFixed(2)) : 0,
        currency: "EUR",
      },
      ...(fiscal &&
        fiscalCategory === 1 && {
          net: {
            value: res[0].total
              ? Number(parseFloat(`${res[0].total * 0.8}`).toFixed(2))
              : 0,
            currency: "EUR",
          },
        }),
    },
  };
};
