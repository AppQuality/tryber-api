import * as db from "@src/features/db";

export default async (
  payment: { id: number; amount: number },
  fiscalType = 1 | 2 | 3 | 4
) => {
  const witholdingPercentage = fiscalType === 1 ? 20 : 0;
  const amountGross = payment.amount * (100 / (100 - witholdingPercentage));
  const amountWitholding = amountGross - payment.amount;
  const stampRequired = amountGross > 77.47 ? 1 : 0;

  await db.query(
    db.format(
      "UPDATE wp_appq_payment_request SET amount_gross = ?, amount_withholding = ?, stamp_required = ?, withholding_tax_percentage = ? WHERE id = ?",
      [
        amountGross,
        amountWitholding,
        stampRequired,
        witholdingPercentage,
        payment.id,
      ]
    )
  );
};
