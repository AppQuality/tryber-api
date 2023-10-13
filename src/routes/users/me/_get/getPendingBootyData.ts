import { tryber } from "@src/features/database";
import G from "glob";

export default async (id: string) => {
  let fiscalCategory = 0;

  const fiscal = (await tryber.tables.WpAppqFiscalProfile.do()
    .select(tryber.ref("fiscal_category").withSchema("wp_appq_fiscal_profile"))
    .join(
      "wp_appq_evd_profile",
      "wp_appq_evd_profile.id",
      "wp_appq_fiscal_profile.tester_id"
    )
    .where("wp_appq_evd_profile.wp_user_id", id)
    .andWhere("wp_appq_fiscal_profile.is_active", 1)
    .first()) as unknown as { fiscal_category: string };

  fiscalCategory = Number(fiscal?.fiscal_category);
  const res = (await tryber.tables.WpAppqPayment.do()
    .sum({ total: "amount" })
    .join(
      "wp_appq_evd_profile",
      "wp_appq_evd_profile.id",
      "wp_appq_payment.tester_id"
    )
    .where("wp_appq_evd_profile.wp_user_id", id)
    .andWhere("is_paid", 0)
    .andWhere("is_requested", 0)
    .first()) as unknown as { total: number };

  if (!res) {
    Promise.reject(Error("Invalid pending booty data"));
  }

  return {
    pending_booty: {
      gross: {
        value: res.total ? Number(res.total.toFixed(2)) : 0,
        currency: "EUR",
      },
      ...(fiscal &&
        fiscalCategory === 1 && {
          net: {
            value: res.total
              ? Number(parseFloat(`${res.total * 0.8}`).toFixed(2))
              : 0,
            currency: "EUR",
          },
        }),
    },
  };
};
