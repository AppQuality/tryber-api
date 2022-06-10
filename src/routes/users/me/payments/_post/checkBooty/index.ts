import * as db from "@src/features/db";
import getCrowdOption from "@src/features/wp/getCrowdOption";

export default async (testerId: number) => {
  const attributions = await db.query(
    db.format(
      `
      SELECT sum(amount) as total
      FROM wp_appq_payment
      WHERE tester_id = ?
        AND is_paid = 0
        AND is_requested = 0`,
      [testerId]
    )
  );
  if (attributions.length === 0 || attributions[0].total === 0) {
    throw new Error("You don't have any booty to pay");
  }
  const threshold = await getCrowdOption("minimum_payout");
  if (threshold && attributions[0].total < threshold) {
    throw new Error(`You need to have at least ${threshold} booty to pay`);
  }
  return attributions[0].total;
};
