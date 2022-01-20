/** OPENAPI-ROUTE:get-users-me-fiscal */
import { Context } from 'openapi-backend';

import getActiveProfile from '../getActiveProfile';

export default async (
  c: Context,
  req: OpenapiRequest,
  res: OpenapiResponse
) => {
  try {
    let fiscal = await getActiveProfile(req.user.testerId);
    const fiscalTypes = {
      1: "withholding",
      2: "witholding-extra",
      3: "other",
      4: "non-italian",
    };

    const fiscalType = fiscalTypes.hasOwnProperty(fiscal.fiscal_category)
      ? fiscalTypes[fiscal.fiscal_category as keyof typeof fiscalTypes]
      : "invalid";

      res.status_code = 200;
    return {
      address: {
        country: fiscal.country || "",
        province: fiscal.province || "",
        city: fiscal.city || "",
        street: fiscal.address,
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
      gender: fiscal.sex == 0 ? "female" : "male",
    };
  } catch (error) {
    res.status_code = (error as OpenapiError).status_code || 500;
    return {
      element: "users",
      id: parseInt(req.user.ID),
      message: (error as OpenapiError).message,
    };
  }
};
