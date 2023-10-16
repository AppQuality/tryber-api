import { fiscalTypes } from "@src/constants";
import { tryber } from "@src/features/database";

export default async (testerId: number) => {
  const fiscalProfile = await tryber.tables.WpAppqFiscalProfile.do()
    .select("id", "fiscal_category")
    .where("tester_id", testerId)
    .where("is_active", 1)
    .where("is_verified", 1);

  if (fiscalProfile.length === 0) {
    throw new Error("You don't have a fiscal profile");
  }
  if (
    ["witholding-extra", "vat", "company"].includes(
      fiscalTypes[fiscalProfile[0].fiscal_category]
    )
  ) {
    throw new Error("Your fiscal profile doesn't match the requirements");
  }
  return fiscalProfile[0];
};
