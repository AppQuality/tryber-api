type Payment = {
  id: string;
  amount: number;
  tester_id: number;
  accountName: string;
  type: "paypal" | "transferwise";
  status: "pending" | "paid" | "error";
  fee?: number;
  coordinates: string;
  error?: OpenapiError;
};
