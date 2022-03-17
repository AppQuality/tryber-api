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
  is_paid: 0,
  request_date: new Date("01/01/1980").toISOString(),
};
const paymentRequestWise = {
  id: 2,
  tester_id: 1,
  amount: 169,
  iban: "DE12345678901234567890",
  is_paid: 1,
  request_date: new Date("01/05/1992").toISOString(),
  receipt_id: 69,
};
const paymentRequestInvalid = {
  id: 3,
  tester_id: 1,
  amount: 69,
  is_paid: 1,
  request_date: new Date("03/05/1979").toISOString(),
  receipt_id: 69,
};
const paymentRequestPaypal2 = {
  id: 4,
  tester_id: 1,
  amount: 170,
  is_paid: 1,
  paypal_email: "john.doe@example.com",
  request_date: new Date("03/05/1979").toISOString(),
  receipt_id: 70,
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
        "request_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ",
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
    expect(response.body.results.map((item: any) => item.id)).toEqual([
      1, 2, 4,
    ]);
  });
  it("Should return requests ordered ASC DESC if order is set", async () => {
    const responseAsc = await request(app)
      .get("/users/me/payments?order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.results.map((item: any) => item.id)).toEqual([
      1, 2, 4,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/payments?order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.results.map((item: any) => item.id)).toEqual([
      4, 2, 1,
    ]);
  });
  it("Should return requests ordered by amount if orderBy=amount is set", async () => {
    const responseAsc = await request(app)
      .get("/users/me/payments?orderBy=amount&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.results.map((item: any) => item.id)).toEqual([
      2, 4, 1,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/payments?orderBy=amount&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.results.map((item: any) => item.id)).toEqual([
      1, 4, 2,
    ]);
  });
  it("Should return requests ordered by request_date if orderBy=request_date is set", async () => {
    const responseAsc = await request(app)
      .get("/users/me/payments?orderBy=request_date&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.results.map((item: any) => item.id)).toEqual([
      4, 1, 2,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/payments?orderBy=request_date&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.results.map((item: any) => item.id)).toEqual([
      2, 1, 4,
    ]);
  });
  it("Should return 2 results if is set limit parameter with limit = 2", async () => {
    const response = await request(app)
      .get("/users/me/payments?limit=2")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("limit");
    expect(response.body.results.map((item: any) => item.id)).toEqual([1, 2]);

    const responseASC = await request(app)
      .get("/users/me/payments?limit=2&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseASC.status).toBe(200);
    expect(responseASC.body).toHaveProperty("limit");
    expect(responseASC.body.results.map((item: any) => item.id)).toEqual([
      1, 2,
    ]);

    const responseDESC = await request(app)
      .get("/users/me/payments?limit=2&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDESC.status).toBe(200);
    expect(responseDESC.body).toHaveProperty("limit");
    expect(responseDESC.body.results.map((item: any) => item.id)).toEqual([
      4, 2,
    ]);
  });
  it("Should skip the first result if is set start=1 parameter", async () => {
    const response = await request(app)
      .get("/users/me/payments?start=1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("start");
    expect(response.body.results.map((item: any) => item.id)).toEqual([2, 4]);

    const responseASC = await request(app)
      .get("/users/me/payments?start=1&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseASC.status).toBe(200);
    expect(responseASC.body).toHaveProperty("start");
    expect(responseASC.body.results.map((item: any) => item.id)).toEqual([
      2, 4,
    ]);

    const responseDESC = await request(app)
      .get("/users/me/payments?start=1&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDESC.status).toBe(200);
    expect(responseDESC.body).toHaveProperty("start");
    expect(responseDESC.body.results.map((item: any) => item.id)).toEqual([
      2, 1,
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
    expect(response.body.size).toBe(3);
    expect(response.body).toHaveProperty("start");
    expect(response.body.start).toBe(0);
  });
});
