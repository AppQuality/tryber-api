import { tryber } from "@src/features/database";

const getTesterFiscalCategory = async (id: string) => {
  const result = await tryber.tables.WpAppqFiscalProfile.do()
    .select(tryber.ref("fiscal_category"))
    .join(
      "wp_appq_evd_profile",
      "wp_appq_evd_profile.id",
      "wp_appq_fiscal_profile.tester_id"
    )
    .where("wp_appq_evd_profile.wp_user_id", id)
    .where("wp_appq_fiscal_profile.is_active", 1)
    .first();

  if (result && result.fiscal_category) {
    return result.fiscal_category;
  }

  return false;
};

export default async (id: string) => {
  const fiscalCategory = await getTesterFiscalCategory(id);

  const result = await tryber.tables.WpAppqPayment.do()
    .sum("amount", { as: "total" })
    .join(
      "wp_appq_evd_profile",
      "wp_appq_evd_profile.id",
      "wp_appq_payment.tester_id"
    )
    .where("wp_appq_evd_profile.wp_user_id", id)
    .where("wp_appq_payment.is_requested", 0)
    .where("wp_appq_payment.is_paid", 0)
    .first();

  if (!result) {
    return Promise.reject(Error("Invalid pending booty data"));
  }
  return {
    pending_booty: {
      gross: {
        value: result.total ? Number(result.total.toFixed(2)) : 0,
        currency: "EUR",
      },
      ...(fiscalCategory !== false &&
        fiscalCategory === 1 && {
          net: {
            value: result.total
              ? Number(parseFloat(`${result.total * 0.8}`).toFixed(2))
              : 0,
            currency: "EUR",
          },
        }),
    },
  };
};
