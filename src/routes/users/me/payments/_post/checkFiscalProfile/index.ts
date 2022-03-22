import * as db from "@src/features/db";

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
  return fiscalProfile[0];
};
