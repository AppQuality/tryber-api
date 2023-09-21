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

  let sql = `SELECT 
    SUM(req.amount_gross) as gross,
    SUM(req.amount) as net
    FROM wp_appq_payment_request AS req
    JOIN wp_appq_evd_profile AS p ON (p.id = req.tester_id)
    WHERE p.wp_user_id = ? AND is_paid = 1;
  `;

  const res = await db.query(db.format(sql, [id]));
  if (!res.length) {
    Promise.reject(Error("Invalid pending booty data"));
  }

  return {
    booty: {
      gross: {
        value: res[0].gross ? Number(parseFloat(res[0].gross).toFixed(2)) : 0,
        currency: "EUR",
      },
      ...(fiscal &&
        fiscalCategory === 1 && {
          net: {
            value: res[0].net ? Number(parseFloat(res[0].net).toFixed(2)) : 0,
            currency: "EUR",
          },
        }),
    },
  };
};
