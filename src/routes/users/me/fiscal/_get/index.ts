/** OPENAPI-ROUTE:get-users-me-fiscal */

import { Context } from "openapi-backend";
import { tryber } from "@src/features/database";

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    res.status_code = 200;
    const fiscal = await getFiscalUser(req.user.testerId);
    return fiscal;
  } catch (error) {
    if (process.env && process.env.DEBUG) {
      console.log(error);
    }
    res.status_code = (error as OpenapiError).status_code || 500;
    return {
      element: "users",
      id: parseInt(req.user.ID),
      message: (error as OpenapiError).message,
    };
  }
};
async function getFiscalUser(tid: number) {
  const fiscal = await tryber.tables.WpAppqFiscalProfile.do()
    .select(
      tryber.ref("country").withSchema("wp_appq_fiscal_profile"),
      tryber.ref("province").withSchema("wp_appq_fiscal_profile"),
      tryber.ref("city").withSchema("wp_appq_fiscal_profile"),
      tryber.ref("address").withSchema("wp_appq_fiscal_profile"),
      tryber.ref("address_number").withSchema("wp_appq_fiscal_profile"),
      tryber.ref("postal_code").withSchema("wp_appq_fiscal_profile"),
      tryber.ref("birth_city").withSchema("wp_appq_fiscal_profile"),
      tryber.ref("birth_province").withSchema("wp_appq_fiscal_profile"),
      tryber.ref("id").withSchema("wp_appq_fiscal_profile"),
      tryber.ref("fiscal_id").withSchema("wp_appq_fiscal_profile"),
      tryber.ref("is_verified").withSchema("wp_appq_fiscal_profile"),
      tryber.ref("sex").withSchema("wp_appq_fiscal_profile"),
      tryber.ref("name").withSchema("fiscal_category").as("fiscal_category")
    )

    .join(
      "fiscal_category",
      "wp_appq_fiscal_profile.fiscal_category",
      "fiscal_category.id"
    )
    .where({ tester_id: tid })
    .andWhere({ is_active: 1 })
    .first();
  if (!fiscal) {
    throw { status_code: 404, message: "No fiscal profile" };
  }

  return {
    address: {
      country: fiscal.country || "",
      province: fiscal.province || "",
      city: fiscal.city || "",
      street: fiscal.address || "",
      streetNumber:
        fiscal.address_number && fiscal.address_number !== ""
          ? fiscal.address_number
          : undefined,
      cityCode: fiscal.postal_code || "",
    },
    type: fiscal.fiscal_category,
    birthPlace: {
      city: fiscal.birth_city || "",
      province: fiscal.birth_province || "",
    },
    fiscalId: fiscal.fiscal_id || "",
    fiscalStatus: fiscal.is_verified ? "Verified" : "Unverified",
    gender: fiscal.sex == "0" ? "female" : "male",
  };
}
