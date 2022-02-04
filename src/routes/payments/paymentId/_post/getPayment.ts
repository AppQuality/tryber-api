export default async (paymentId: string): Promise<Payment> => {
  return {
    id: paymentId,
    amount: 10,
    type: "transferwise",
    status: "pending",
  };
};
