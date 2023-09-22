import { tryber } from "@src/features/database";

export default async (
  payment: { id: number; amount: number },
  fiscalType = 1 | 2 | 3 | 4
) => {
  const witholdingPercentage = fiscalType === 1 ? 20 : 0;
  const amountGross = payment.amount * (100 / (100 - witholdingPercentage));
  const amountWitholding = amountGross - payment.amount;
  const stampRequired = amountGross > 77.47 ? 1 : 0;

  await tryber.tables.WpAppqPaymentRequest.do()
    .update({
      amount_gross: amountGross,
      amount_withholding: amountWitholding,
      stamp_required: stampRequired,
      withholding_tax_percentage: witholdingPercentage,
    })
    .where("id", payment.id);
};
