import { tryber } from "@src/features/database";
import * as db from "@src/features/db";

export default async (id: string) => {
  const fiscal = await tryber.tables.WpAppqFiscalProfile.do()
    .select("fiscal_category")
    .where("tester_id", id)
    .where("is_active", 1)
    .first();

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
      gross: { value: Number(res[0].total) ?? 0, currency: "EUR" },
      ...(fiscal &&
        fiscal.fiscal_category === 1 && {
          net: {
            value: res[0].total
              ? Number((res[0].total * 0.8).toPrecision(4))
              : 0,
            currency: "EUR",
          },
        }),
    },
  };
};
