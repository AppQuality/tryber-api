import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");

const paymentRequestPaypal = {
  id: 1,
  tester_id: 1,
  amount: 269,
  paypal_email: "john.doe@example.com",
  is_paid: 1,
  update_date: "1980-01-01 00:00:00",
};
const paymentRequestWise = {
  id: 2,
  tester_id: 1,
  amount: 169,
  iban: "DE12345678901234567890",
  is_paid: 1,
  update_date: "1992-05-01 00:00:00",
  receipt_id: 69,
};
const paymentRequestInvalid = {
  id: 3,
  tester_id: 1,
  amount: 69,
  is_paid: 1,
  update_date: "1979-05-03 00:00:00",
  receipt_id: 69,
};
const paymentRequestPaypal2 = {
  id: 4,
  tester_id: 1,
  amount: 170,
  is_paid: 1,
  paypal_email: "john.doe@example.com",
  update_date: "1979-05-03 00:00:00",
  receipt_id: 70,
};
const paymentRequestPaypalProcessing = {
  id: 5,
  tester_id: 1,
  amount: 49000,
  is_paid: 0,
  paypal_email: "john.doe@example.com",
  update_date: "1979-05-03 00:00:00",
};
const receiptWise = {
  id: 69,
  url: "https://example.com/receiptWise",
};
const receiptPaypal = {
  id: 70,
  url: "https://example.com/receiptPaypal",
};
describe("GET /users/me/payments", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.createTable("wp_appq_payment_request", [
        "id INTEGER PRIMARY KEY",
        "tester_id INTEGER",
        "amount INTEGER",
        "iban VARCHAR(255)",
        "paypal_email VARCHAR(255)",
        "update_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
        "error_message text",
        "is_paid BOOL",
        "receipt_id INTEGER",
      ]);
      await sqlite3.createTable("wp_appq_receipt", [
        "id INTEGER PRIMARY KEY",
        "url VARCHAR(256)",
      ]);
      await sqlite3.insert("wp_appq_payment_request", paymentRequestPaypal);
      await sqlite3.insert("wp_appq_payment_request", paymentRequestWise);
      await sqlite3.insert("wp_appq_payment_request", paymentRequestInvalid);
      await sqlite3.insert("wp_appq_payment_request", paymentRequestPaypal2);
      await sqlite3.insert(
        "wp_appq_payment_request",
        paymentRequestPaypalProcessing
      );
      await sqlite3.insert("wp_appq_receipt", receiptWise);
      await sqlite3.insert("wp_appq_receipt", receiptPaypal);
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.dropTable("wp_appq_payment_request");

      resolve(null);
    });
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/users/me/payments");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged in", async () => {
    const response = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should return all tryber payment requests", async () => {
    const response = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      results: [
        {
          amount: {
            currency: "EUR",
            value: 49000,
          },
          id: 5,
          method: {
            note: "john.doe@example.com",
            type: "paypal",
          },
          paidDate: "-",
          status: "processing",
        },
        {
          amount: {
            currency: "EUR",
            value: 169,
          },
          id: 2,
          method: {
            note: "Iban ************567890",
            type: "iban",
          },
          paidDate: "1992-05-01",
          receipt: "https://example.com/receiptWise",
          status: "paid",
        },
        {
          amount: {
            currency: "EUR",
            value: 269,
          },
          id: 1,
          method: {
            note: "john.doe@example.com",
            type: "paypal",
          },
          paidDate: "1980-01-01",
          status: "paid",
        },
        {
          amount: {
            currency: "EUR",
            value: 170,
          },
          id: 4,
          method: {
            note: "john.doe@example.com",
            type: "paypal",
          },
          paidDate: "1979-05-03",
          receipt: "https://example.com/receiptPaypal",
          status: "paid",
        },
      ],
      size: 4,
      start: 0,
    });
  });
  it("Should return requests ordered ASC DESC if order is set", async () => {
    const responseAsc = await request(app)
      .get("/users/me/payments?order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.results.map((item: any) => item.id)).toEqual([
      4, 1, 2, 5,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/payments?order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.results.map((item: any) => item.id)).toEqual([
      5, 2, 1, 4,
    ]);
  });
  it("Should return requests ordered by amount if orderBy=amount is set", async () => {
    const responseAsc = await request(app)
      .get("/users/me/payments?orderBy=amount&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.results.map((item: any) => item.id)).toEqual([
      2, 4, 1, 5,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/payments?orderBy=amount&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.results.map((item: any) => item.id)).toEqual([
      5, 1, 4, 2,
    ]);
  });
  it("Should return requests ordered by request_date if orderBy=paidDate is set", async () => {
    const responseAsc = await request(app)
      .get("/users/me/payments?orderBy=paidDate&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.results.map((item: any) => item.id)).toEqual([
      4, 1, 2, 5,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/payments?orderBy=paidDate&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.results.map((item: any) => item.id)).toEqual([
      5, 2, 1, 4,
    ]);
  });
  it("Should return requests ordered by request_date DESC by default", async () => {
    const responseDesc = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.results.map((item: any) => item.id)).toEqual([
      5, 2, 1, 4,
    ]);
  });
  it("Should return 3 results if is set limit parameter with limit = 2", async () => {
    const response = await request(app)
      .get("/users/me/payments?limit=2")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("limit");
    expect(response.body.limit).toBe(2);
    expect(response.body.results.map((item: any) => item.id)).toEqual([5, 2]);

    const responseASC = await request(app)
      .get("/users/me/payments?limit=2&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseASC.status).toBe(200);
    expect(responseASC.body).toHaveProperty("limit");
    expect(responseASC.body.results.map((item: any) => item.id)).toEqual([
      4, 1,
    ]);

    const responseDESC = await request(app)
      .get("/users/me/payments?limit=2&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDESC.status).toBe(200);
    expect(responseDESC.body).toHaveProperty("limit");
    expect(responseDESC.body.results.map((item: any) => item.id)).toEqual([
      5, 2,
    ]);
  });
  it("Should skip the first result if is set start=1 parameter", async () => {
    const response = await request(app)
      .get("/users/me/payments?start=1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("start");
    expect(response.body.start).toBe(1);
    expect(response.body.results.map((item: any) => item.id)).toEqual([
      2, 1, 4,
    ]);

    const responseASC = await request(app)
      .get("/users/me/payments?start=1&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseASC.status).toBe(200);
    expect(responseASC.body).toHaveProperty("start");
    expect(responseASC.body.results.map((item: any) => item.id)).toEqual([
      1, 2, 5,
    ]);

    const responseDESC = await request(app)
      .get("/users/me/payments?start=1&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDESC.status).toBe(200);
    expect(responseDESC.body).toHaveProperty("start");
    expect(responseDESC.body.results.map((item: any) => item.id)).toEqual([
      2, 1, 4,
    ]);
  });

  it("Should return the size that is equal to number of results", async () => {
    const response = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.size).toBe(response.body.results.length);
    const responseStart = await request(app)
      .get("/users/me/payments?start=2&limit=2")
      .set("authorization", "Bearer tester");
    expect(responseStart.status).toBe(200);
    expect(responseStart.body.size).toBe(responseStart.body.results.length);
  });
  it("Should return the size of limit if limit is set", async () => {
    const response = await request(app)
      .get("/users/me/payments?limit=50")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.limit).toBe(50);
    expect(response.body).toHaveProperty("limit");
    const responseNoLimit = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(responseNoLimit.status).toBe(200);
    expect(responseNoLimit.body).not.toHaveProperty("limit");
  });
  it("Should return total of records only if limit is set", async () => {
    const response = await request(app)
      .get("/users/me/payments?limit=50")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("limit");
    expect(response.body).toHaveProperty("total");
    const responseNoLimit = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(responseNoLimit.status).toBe(200);
    expect(responseNoLimit.body).not.toHaveProperty("limit");
    expect(responseNoLimit.body).not.toHaveProperty("total");
  });
  it("Should return size and start", async () => {
    const response = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("size");
    expect(response.body.size).toBe(4);
    expect(response.body).toHaveProperty("start");
    expect(response.body.start).toBe(0);
  });
  it("Should return - as paidDate if status is processing", async () => {
    const response = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results[0].status).toBe("processing");
    response.body.results.forEach(
      (el: {
        id: number;
        status: string;
        amount: object;
        paidDate: string;
        method: object;
        receipt?: string;
      }) => {
        if (el.status === "processing") expect(el.paidDate).toEqual("-");
        else {
          expect(el.paidDate.length).toEqual(10);
          expect(el.paidDate).toMatch(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/); //YYYY-MM-DD
        }
      }
    );
  });
});

describe("Route GET payment-requests when no data", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.createTable("wp_appq_payment_request", [
        "id INTEGER PRIMARY KEY",
        "tester_id INTEGER",
        "amount INTEGER",
        "iban VARCHAR(255)",
        "paypal_email VARCHAR(255)",
        "update_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
        "error_message text",
        "is_paid BOOL",
        "receipt_id INTEGER",
      ]);
      await sqlite3.createTable("wp_appq_receipt", [
        "id INTEGER PRIMARY KEY",
        "url VARCHAR(256)",
      ]);
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.dropTable("wp_appq_payment_request");
      await sqlite3.dropTable("wp_appq_receipt");
      resolve(null);
    });
  });
  it("Should return 404", async () => {
    const response = await request(app)
      .get("/users/me/payments")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      element: "payment-requests",
      id: 0,
      message: "No payments resquests until now",
    });
  });
});
