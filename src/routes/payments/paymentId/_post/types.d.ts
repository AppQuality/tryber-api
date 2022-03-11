type Payment = {
  id: number;
  amount: number;
  tester_id: number;
  accountName: string;
  testerEmail: string;
  type: "paypal" | "transferwise";
  status: "pending" | "paid" | "error";
  fee?: number;
  coordinates: string;
  error?: OpenapiError;
};
