import * as db from "@src/features/db";

const fiscalTypes = {
  withholding: 1,
  "witholding-extra": 2,
  vat: 3,
  "non-italian": 4,
  company: 5,
};

export default async (testerId: number) => {
  const fiscalProfile = await db.query(
    db.format(
      `
      SELECT id, fiscal_category
      FROM wp_appq_fiscal_profile
      WHERE tester_id = ? AND is_active = 1 AND is_verified = 1`,
      [testerId]
    )
  );

  if (fiscalProfile.length === 0) {
    throw new Error("You don't have a fiscal profile");
  }

  if (
    [
      fiscalTypes["witholding-extra"],
      fiscalTypes.vat,
      fiscalTypes.company,
    ].includes(fiscalProfile[0].fiscal_category)
  ) {
    throw new Error("Your fiscal profile doesn't match the requirements");
  }
  return fiscalProfile[0];
};
