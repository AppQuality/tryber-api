import { tryber } from "@src/features/database";
import * as db from "@src/features/db";

export default async (id: string) => {
  const fiscal = await tryber.tables.WpAppqFiscalProfile.do()
    .select("fiscal_category")
    .where("tester_id", id)
    .where("is_active", 1)
    .first();

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
      gross: { value: Number(res[0].gross) ?? 0, currency: "EUR" },
      ...(fiscal &&
        fiscal.fiscal_category === 1 && {
          net: {
            value: Number(res[0].net) ?? 0,
            currency: "EUR",
          },
        }),
    },
  };
};
