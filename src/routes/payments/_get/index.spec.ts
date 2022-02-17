import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import request from "supertest";

const tester1 = {
  id: 1,
  name: "John",
  surname: "Doe",
};
const tester2 = {
  id: 5,
  name: "Pippo",
  surname: "Franco",
};

const paymentRequestPaypal = {
  id: 1,
  tester_id: tester1.id,
  amount: 100,
  paypal_email: "john.doe@example.com",
  is_paid: 0,
  request_date: new Date(),
};

const paymentRequestPaypalWithError = {
  id: 2,
  tester_id: tester1.id,
  amount: 100,
  paypal_email: "john.doe@example.com",
  is_paid: 0,
  request_date: new Date(),
  update_date: new Date(),
  error_message: "Error message",
};

const paymentRequestWise = {
  id: 3,
  tester_id: tester2.id,
  amount: 100,
  iban: "DE12345678901234567890",
  is_paid: 0,
  request_date: new Date(),
};

const paymentRequestWiseWithError = {
  id: 4,
  tester_id: tester2.id,
  amount: 100,
  iban: "DE12345678901234567890",
  is_paid: 0,
  request_date: new Date(),
  update_date: new Date(),
  error_message: "Error message",
};

describe("Route GET payments", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.createTable("wp_appq_evd_profile", [
        "id INTEGER PRIMARY KEY",
        "name VARCHAR(255)",
        "surname VARCHAR(255)",
      ]);

      await sqlite3.createTable("wp_appq_payment_request", [
        "id INTEGER PRIMARY KEY",
        "tester_id INTEGER",
        "amount INTEGER",
        "iban VARCHAR(255)",
        "paypal_email VARCHAR(255)",
        "request_date DATETIME",
        "update_date DATETIME",
        "error_message text",
        "is_paid BOOL",
      ]);

      await sqlite3.insert("wp_appq_evd_profile", tester1);
      await sqlite3.insert("wp_appq_evd_profile", tester2);

      await sqlite3.insert("wp_appq_payment_request", paymentRequestPaypal);
      await sqlite3.insert("wp_appq_payment_request", paymentRequestWise);
      await sqlite3.insert(
        "wp_appq_payment_request",
        paymentRequestPaypalWithError
      );
      await sqlite3.insert(
        "wp_appq_payment_request",
        paymentRequestWiseWithError
      );

      resolve(null);
    });
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/payments");
    expect(response.status).toBe(403);
  });
  it("Should answer 403 if logged in with a non-admin user", async () => {
    const response = await request(app)
      .get("/payments")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged in with an admin user", async () => {
    const response = await request(app)
      .get("/payments")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });
  it("Should answer with a list of payments on success", async () => {
    const response = await request(app)
      .get("/payments")
      .set("authorization", "Bearer admin");
    expect(response.body).toMatchObject({
      items: [
        {
          created: paymentRequestPaypal.request_date.getTime(),
          id: paymentRequestPaypal.id,
          amount: {
            value: paymentRequestPaypal.amount,
            currency: "EUR",
          },
          type: "paypal",
          tryber: tester1,
        },
        {
          created: paymentRequestPaypalWithError.request_date.getTime(),
          updated: paymentRequestPaypalWithError.update_date.getTime(),
          id: paymentRequestPaypalWithError.id,
          amount: {
            value: paymentRequestPaypalWithError.amount,
            currency: "EUR",
          },
          type: "paypal",
          tryber: tester1,
          error: paymentRequestPaypalWithError.error_message,
        },
        {
          created: paymentRequestWise.request_date.getTime(),
          id: paymentRequestWise.id,
          amount: {
            value: paymentRequestWise.amount,
            currency: "EUR",
          },
          type: "transferwise",
          tryber: tester2,
        },
        {
          created: paymentRequestWiseWithError.request_date.getTime(),
          updated: paymentRequestWiseWithError.update_date.getTime(),
          id: paymentRequestWiseWithError.id,
          amount: {
            value: paymentRequestWiseWithError.amount,
            currency: "EUR",
          },
          type: "transferwise",
          tryber: tester2,
          error: paymentRequestWiseWithError.error_message,
        },
      ],
    });
  });
});
