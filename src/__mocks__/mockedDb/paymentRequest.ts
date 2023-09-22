import sqlite3 from "@src/features/sqlite";

const tableName = "wp_appq_payment_request";
export const table = {
  create: async () => {
    await sqlite3.createTable(tableName, [
      "id INTEGER PRIMARY KEY",
      "tester_id INTEGER",
      "amount DECIMAL(11,2)",
      "amount_gross DECIMAL(11,2)",
      "amount_withholding DECIMAL(11,2)",
      "withholding_tax_percentage INTEGER",
      "iban VARCHAR(255)",
      "paypal_email VARCHAR(255)",
      "account_holder_name VARCHAR(255)",
      "update_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
      "error_message text",
      "is_paid BOOL",
      "stamp_required BOOL",
      "fiscal_profile_id INTEGER",
      "request_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ",
      "amount_paypal_fee FLOAT(2)",
      "paid_date DATETIME",
      "receipt_id INTEGER",
    ]);
  },
  drop: async () => {
    await sqlite3.dropTable(tableName);
  },
};

type RequestParams = {
  id?: number;
  tester_id?: number;
  amount?: number;
  amount_gross?: number;
  amount_withholding?: number;
  iban?: string;
  paypal_email?: string;
  account_holder_name?: string;
  update_date?: string;
  error_message?: string;
  is_paid?: 1 | 0;
  stamp_required?: 1 | 0;
  withholding_tax_percentage?: number;
  fiscal_profile_id?: number;
  under_threshold?: number;
};

const data: {
  [key: string]: (params?: RequestParams) => Promise<{ [key: string]: any }>;
} = {
  drop: async () => {
    return await sqlite3.run(`DELETE FROM ${tableName}`);
  },
};

data.basicPayment = async (params) => {
  const item = {
    id: 1,
    tester_id: 1,
    is_paid: 0,
    update_date: "1979-05-03 00:00:00",
    under_threshold: 0,
    withholding_tax_percentage: 0,
    ...params,
  };
  await sqlite3.insert("wp_appq_payment_request", item);
  return item;
};

data.processingPaypalPayment = async (params) => {
  const item = {
    id: 1,
    tester_id: 1,
    amount: 49000,
    is_paid: 0,
    paypal_email: "john.doe@example.com",
    update_date: "1979-05-03 00:00:00",
    under_threshold: 0,
    withholding_tax_percentage: 20,
    ...params,
  };
  await sqlite3.insert("wp_appq_payment_request", item);
  return item;
};
data.paidPaypalPayment = async (params) => {
  const item2 = {
    id: 1,
    tester_id: 1,
    amount: 49000,
    is_paid: 1,
    paypal_email: "john.doe@example.com",
    update_date: "1980-05-03 00:00:00",
    under_threshold: 0,
    withholding_tax_percentage: 20,
    ...params,
  };
  await sqlite3.insert("wp_appq_payment_request", item2);
  return item2;
};
export { data };
