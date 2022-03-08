import sqlite3 from "@src/features/sqlite";

import getPayment from ".";

jest.mock("@src/features/db");

const tester = {
  id: 1,
  name: "John",
  surname: "Doe",
  email: "tester@example.com",
};
const validBankTransferPayment = {
  id: 1,
  tester_id: tester.id,
  amount: 100,
  iban: "DE12345678901234567890",
  is_paid: 0,
};
const validPaypalPayment = {
  id: 2,
  tester_id: tester.id,
  amount: 100,
  paypal_email: "john.doe@example.com",
  is_paid: 0,
};

const invalidTypePayment = {
  id: 3,
  tester_id: tester.id,
  amount: 100,
  is_paid: 0,
};

describe("POST /payments/:paymentId", () => {
  beforeAll(() => {
    return new Promise(async (resolve) => {
      await sqlite3.createTable("wp_appq_payment_request", [
        "id INTEGER PRIMARY KEY",
        "tester_id INTEGER",
        "amount INTEGER",
        "iban VARCHAR(255)",
        "paypal_email VARCHAR(255)",
        "is_paid BOOL",
      ]);
      await sqlite3.createTable("wp_appq_evd_profile", [
        "id INTEGER PRIMARY KEY",
        "name VARCHAR(255)",
        "surname VARCHAR(255)",
        "email VARCHAR(255)",
      ]);

      await sqlite3.insert("wp_appq_payment_request", validBankTransferPayment);
      await sqlite3.insert("wp_appq_payment_request", validPaypalPayment);
      await sqlite3.insert("wp_appq_payment_request", invalidTypePayment);

      await sqlite3.insert("wp_appq_evd_profile", tester);

      resolve(null);
    });
  });
  it('Should throw "No payment found" error on no results', async () => {
    try {
      await getPayment(100);
      fail("Should throw error");
    } catch (error) {
      expect((error as OpenapiError).message).toBe("No payment found");
    }
  });
  it('Should throw "Invalid payment type" error if no paypal email and no iban', async () => {
    try {
      await getPayment(3);
      fail("Should throw error");
    } catch (error) {
      expect((error as OpenapiError).message).toBe("Invalid payment type");
    }
  });
  it("Should return a transferwise payment object if iban is present", async () => {
    try {
      const payment = await getPayment(validBankTransferPayment.id);
      expect(payment).toMatchObject({
        id: validBankTransferPayment.id,
        tester_id: tester.id,
        accountName: `${tester.name} ${tester.surname}`,
        amount: validBankTransferPayment.amount,
        type: "transferwise",
        coordinates: validBankTransferPayment.iban,
        testerEmail: tester.email,
        status: "pending",
      });
    } catch (error) {
      throw error;
    }
  });
  it("Should return a paypal payment object if paypal email is present", async () => {
    try {
      const payment = await getPayment(validPaypalPayment.id);
      expect(payment).toMatchObject({
        id: validPaypalPayment.id,
        tester_id: tester.id,
        accountName: `${tester.name} ${tester.surname}`,
        amount: validPaypalPayment.amount,
        type: "paypal",
        coordinates: validPaypalPayment.paypal_email,
        testerEmail: tester.email,
        status: "pending",
      });
    } catch (error) {
      throw error;
    }
  });
});
