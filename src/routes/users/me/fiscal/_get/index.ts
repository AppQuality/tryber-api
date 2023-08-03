/** OPENAPI-ROUTE:get-users-me-fiscal */

import { Context } from "openapi-backend";
import { tryber } from "@src/features/database";
import { fiscalTypes } from "@src/constants";

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
    .select("*")
    .where({ tester_id: tid })
    .andWhere({ is_active: 1 })
    .first();
  if (!fiscal) {
    throw { status_code: 404, message: "No fiscal profile" };
  }
  const fiscalType =
    fiscal.fiscal_category > 0
      ? fiscalTypes[fiscal.fiscal_category]
      : "invalid";
  if (fiscalType == "invalid") {
    throw { status_code: 403, message: "Fiscal type is invalid" };
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
    type: fiscalType,
    birthPlace: {
      city: fiscal.birth_city || "",
      province: fiscal.birth_province || "",
    },
    fiscalId: fiscal.fiscal_id || "",
    fiscalStatus: fiscal.is_verified ? "Verified" : "Unverified",
    gender: fiscal.sex == "0" ? "female" : "male",
  };
}
