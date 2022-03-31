import sqlite3 from "@src/features/sqlite";

export const table = {
  create: async () => {
    await sqlite3.createTable("wp_appq_payment_request", [
      "id INTEGER PRIMARY KEY",
      "tester_id INTEGER",
      "amount DECIMAL(11,2)",
      "amount_gross DECIMAL(11,2)",
      "amount_withholding DECIMAL(11,2)",
      "iban VARCHAR(255)",
      "paypal_email VARCHAR(255)",
      "account_holder_name VARCHAR(255)",
      "update_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
      "error_message text",
      "is_paid BOOL",
      "stamp_required BOOL",
      "withholding_tax_percentage INTEGER",
      "fiscal_profile_id INTEGER",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable("wp_appq_payment_request");
  },
};

const data: {
  [key: string]: (params?: any) => Promise<{ [key: string]: any }>;
} = {};

data.processingPaypalPayment = async (params?: { tester_id: number }) => {
  const item = {
    id: 1,
    tester_id: 1,
    amount: 49000,
    is_paid: 0,
    paypal_email: "john.doe@example.com",
    update_date: "1979-05-03 00:00:00",
    ...params,
  };
  await sqlite3.insert("wp_appq_payment_request", item);
  return item;
};

export { data };
