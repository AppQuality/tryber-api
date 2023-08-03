/** OPENAPI-CLASS: get-users-me-fiscal */

import { Context } from "openapi-backend";
import { tryber } from "@src/features/database";
import UserRoute from "@src/features/routes/UserRoute";

export default class GetFiscalProfile extends UserRoute<{
  response: StoplightOperations["get-users-me-fiscal"]["responses"]["200"]["content"]["application/json"];
}> {
  private fiscalTypes = [
    "invalid",
    "withholding",
    "witholding-extra",
    "vat",
    "non-italian",
    "company",
  ] as const;

  protected async prepare(): Promise<void> {
    try {
      const fiscal = await this.getActiveFiscalProfile(this.getTesterId());
      console.log(fiscal);

      this.setSuccess(200, fiscal);
    } catch (e) {
      const error = e as OpenapiError;
      this.setError(error.status_code || 500, error);
    }
  }

  protected async getActiveFiscalProfile(tid: number) {
    const fiscal = await tryber.tables.WpAppqFiscalProfile.do()
      .select("*")
      .where({ tester_id: tid })
      .andWhere({ is_active: 1 })
      .first();
    if (!fiscal) {
      throw { status_code: 404, message: "No fiscal profile" };
    }
    const fiscalType = this.fiscalTypes.hasOwnProperty(fiscal.fiscal_category)
      ? this.fiscalTypes[
          fiscal.fiscal_category as unknown as keyof typeof this.fiscalTypes
        ]
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
}
