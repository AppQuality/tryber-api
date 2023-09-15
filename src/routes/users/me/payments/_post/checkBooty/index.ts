import { tryber } from "@src/features/database";
import getCrowdOption from "@src/features/wp/getCrowdOption/knex";

export default async (testerId: number) => {
  const attributions = await tryber.tables.WpAppqPayment.do()
    .sum("amount", { as: "total" })
    .where({ tester_id: testerId, is_paid: 0, is_requested: 0 });
  if (!attributions[0].total) {
    throw new Error("You don't have any booty to pay");
  }
  const threshold = await getCrowdOption("minimum_payout");
  if (threshold && attributions[0].total < parseFloat(threshold)) {
    throw new Error(`You need to have at least ${threshold} booty to pay`);
  }
  return attributions[0].total;
};
