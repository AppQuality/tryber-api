import { tryber } from "@src/features/database";

export default async (testerId: number) => {
  const processingPaymentRequest = await tryber.tables.WpAppqPaymentRequest.do()
    .select("id")
    .where({ tester_id: testerId, is_paid: 0 });

  if (processingPaymentRequest.length > 0) {
    throw new Error("You already have a pending payment");
  }
  return true;
};
