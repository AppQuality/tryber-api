import * as db from "@src/features/db";

export default async (testerId: number) => {
  const processingPaymentRequest = await db.query(
    db.format(
      `
      SELECT id 
      FROM wp_appq_payment_request
      WHERE tester_id = ? AND is_paid = 0`,
      [testerId]
    )
  );
  if (processingPaymentRequest.length > 0) {
    throw new Error("You already have a pending payment");
  }
  return true;
};
