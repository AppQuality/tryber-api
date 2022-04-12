import Paypal from "@src/features/paypal";
import dotenv from "dotenv";

dotenv.config();
export default async (payment: Payment): Promise<Payment> => {
  const paypal = new Paypal({
    clientId: process.env.PAYPAL_CLIENT_ID || "",
    secret: process.env.PAYPAL_SECRET || "",
    sandbox: !!parseInt(process.env.PAYPAL_IS_SANDBOX || ""),
  });

  let results;
  try {
    results = await paypal.createPayment({
      amount: payment.amount,
      email: payment.coordinates,
      reason: `Payment no.${payment.id}`,
    });
  } catch (error) {
    throw error;
  }
  return {
    ...payment,
    fee: results.fee,
    status: "paid",
  };
};
