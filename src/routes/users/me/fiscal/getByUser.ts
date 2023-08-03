import { fiscalTypes } from "@src/constants";
import getActiveProfile from "./getActiveProfile";

export default async (testerId: number) => {
  try {
    let fiscal = await getActiveProfile(testerId);

    const fiscalType = fiscalTypes.hasOwnProperty(fiscal.fiscal_category)
      ? fiscalTypes[fiscal.fiscal_category as keyof typeof fiscalTypes]
      : "invalid";
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
  } catch (e) {
    throw e;
  }
};
