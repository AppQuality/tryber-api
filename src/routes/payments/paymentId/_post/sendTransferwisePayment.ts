import Transferwise from "@src/features/tranferwise";
import dotenv from "dotenv";

dotenv.config();
export default async (payment: Payment): Promise<Payment> => {
  const transferwise = new Transferwise({
    apiKey: process.env.TRANSFERWISE_API_KEY || "",
    sandbox: true,
  });

  let results;
  try {
    results = await transferwise.createPayment({
      targetAmount: payment.amount,
      accountHolderName: payment.accountName,
      iban: payment.coordinates,
      reason: `Payment no.${payment.id}`,
    });
  } catch (error) {
    throw error;
  }
  return {
    ...payment,
    fee: results.quote.paymentOptions.fee.total,
    status: "paid",
  };
};
