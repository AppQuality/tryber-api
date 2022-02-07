export default async (payment: Payment): Promise<Payment> => {
  return {
    ...payment,
    status: "paid",
  };
};
