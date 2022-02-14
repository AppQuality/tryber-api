import sqlite3 from "@src/features/sqlite";

import updatePayment from ".";

jest.mock("@src/features/db");

const paymentWithError: Payment = {
  id: 1,
  tester_id: 1,
  amount: 100,
  coordinates: "DE12345678901234567890",
  accountName: "John Doe",
  status: "pending",
  type: "transferwise",
  error: {
    status_code: 400,
    name: "Bad Request",
    message: "Error message",
  },
};

const validBankTransferPayment = {
  id: 1,
  tester_id: 1,
  amount: 100,
  iban: "DE12345678901234567890",
  is_paid: 0,
};
describe("updatePayment", () => {
  beforeAll(() => {
    return new Promise(async (resolve) => {
      await sqlite3.createTable("wp_appq_payment_request", [
        "id INTEGER PRIMARY KEY",
        "tester_id INTEGER",
        "amount INTEGER",
        "iban VARCHAR(255)",
        "paypal_email VARCHAR(255)",
        "is_paid BOOL",
        "error_message text",
      ]);
      await sqlite3.createTable("wp_appq_evd_profile", [
        "id INTEGER PRIMARY KEY",
        "name VARCHAR(255)",
        "surname VARCHAR(255)",
      ]);

      await sqlite3.insert("wp_appq_payment_request", validBankTransferPayment);

      resolve(null);
    });
  });
  it("Should update error when payment has error", async () => {
    await updatePayment(paymentWithError);
    const payment = await sqlite3.get(
      `SELECT error_message FROM wp_appq_payment_request WHERE id = ${paymentWithError.id} `
    );
    expect(payment.error_message).toBe(paymentWithError.error?.message);
  });
});
