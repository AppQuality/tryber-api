import { tryber } from "@src/features/database";

export default async (id: string) => {
  try {
    let fiscalCategory = 0;

    const fiscalQuery = (await tryber.tables.WpAppqFiscalProfile.do()
      .select(
        tryber.ref("fiscal_category").withSchema("wp_appq_fiscal_profile")
      )
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.id",
        "wp_appq_fiscal_profile.tester_id"
      )
      .where("wp_appq_evd_profile.wp_user_id", id)
      .andWhere("wp_appq_fiscal_profile.is_active", 1)
      .first()) as unknown as { fiscal_category: string };

    fiscalCategory = Number(fiscalQuery.fiscal_category);

    const res = (await tryber.tables.WpAppqPaymentRequest.do()
      .sum({ gross: "amount_gross", net: "amount" })
      .join(
        "wp_appq_evd_profile",
        "wp_appq_evd_profile.id",
        "wp_appq_payment_request.tester_id"
      )
      .where("wp_appq_evd_profile.wp_user_id", id)
      .andWhere("is_paid", 1)
      .first()) as unknown as { gross: string; net: string };

    if (!res) Promise.reject(Error("Invalid pending booty data"));

    return {
      booty: {
        gross: {
          value: res.gross ? Number(parseFloat(res.gross).toFixed(2)) : 0,
          currency: "EUR",
        },
        ...(fiscalQuery &&
          fiscalCategory === 1 && {
            net: {
              value: res.net ? Number(parseFloat(res.net).toFixed(2)) : 0,
              currency: "EUR",
            },
          }),
      },
    };
  } catch (e) {
    throw e;
  }
};
