import * as db from "@src/features/db";
import getCrowdOption from "@src/features/wp/getCrowdOption";

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
  const threshold = await getCrowdOption("minimum_payout");
  if (threshold && currentBooty[0].pending_booty < threshold) {
    throw new Error(`You need to have at least ${threshold} booty to pay`);
  }
  return currentBooty[0].pending_booty;
};
