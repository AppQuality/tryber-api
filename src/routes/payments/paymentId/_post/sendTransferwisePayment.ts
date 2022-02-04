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
      accountHolderName: "Nome Cognome",
      iban: "DE46500105174335523977",
      reason: `${new Date().getTime()}`,
    });
  } catch (error) {
    throw error;
  }
  return {
    ...payment,
    status: "paid",
  };
};
