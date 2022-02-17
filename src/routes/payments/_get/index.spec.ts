import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import request from "supertest";

jest.mock("@src/features/db");
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
  request_date: new Date().toISOString(),
};

const paymentRequestPaypalWithError = {
  id: 2,
  tester_id: tester1.id,
  amount: 100,
  paypal_email: "john.doe@example.com",
  is_paid: 0,
  request_date: new Date().toISOString(),
  update_date: new Date().toISOString(),
  error_message: "Error message",
};

const paymentRequestWise = {
  id: 3,
  tester_id: tester2.id,
  amount: 100,
  iban: "DE12345678901234567890",
  is_paid: 0,
  request_date: new Date().toISOString(),
};

const paymentRequestWiseWithError = {
  id: 4,
  tester_id: tester2.id,
  amount: 100,
  iban: "DE12345678901234567890",
  is_paid: 0,
  request_date: new Date().toISOString(),
  update_date: new Date().toISOString(),
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
        "request_date TIMESTAMP",
        "update_date TIMESTAMP",
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
          created: new Date(paymentRequestPaypal.request_date)
            .getTime()
            .toString(),
          id: paymentRequestPaypal.id,
          amount: {
            value: paymentRequestPaypal.amount,
            currency: "EUR",
          },
          type: "paypal",
          tryber: tester1,
        },
        {
          created: new Date(paymentRequestPaypalWithError.request_date)
            .getTime()
            .toString(),
          updated: new Date(paymentRequestPaypalWithError.update_date)
            .getTime()
            .toString(),
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
          created: new Date(paymentRequestWise.request_date)
            .getTime()
            .toString(),
          id: paymentRequestWise.id,
          amount: {
            value: paymentRequestWise.amount,
            currency: "EUR",
          },
          type: "transferwise",
          tryber: tester2,
        },
        {
          created: new Date(paymentRequestWiseWithError.request_date)
            .getTime()
            .toString(),
          updated: new Date(paymentRequestWiseWithError.update_date)
            .getTime()
            .toString(),
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
  it("Should order based on order parameters", async () => {
    const responseAsc = await request(app)
      .get("/payments?order=ASC")
      .set("authorization", "Bearer admin");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.items.map((item: any) => item.id)).toEqual([
      1, 2, 3, 4,
    ]);
    const responseDesc = await request(app)
      .get("/payments?order=DESC")
      .set("authorization", "Bearer admin");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.items.map((item: any) => item.id)).toEqual([
      4, 3, 2, 1,
    ]);
  });
});
