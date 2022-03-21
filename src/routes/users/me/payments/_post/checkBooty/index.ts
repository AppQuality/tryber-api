import * as db from "@src/features/db";

export default async (testerId: number) => {
  const currentBooty = await db.query(
    db.format(
      `
  SELECT pending_booty 
  FROM wp_appq_evd_profile
  WHERE id = ?`,
      [testerId]
    )
  );
  if (currentBooty.length === 0 || currentBooty[0].pending_booty === 0) {
    throw new Error("You don't have any booty to pay");
  }
  return true;
};
