type Payment = {
  id: string;
  amount: number;
  type: "paypal" | "transferwise";
  status: "pending" | "paid" | "error";
  error?: string;
};
