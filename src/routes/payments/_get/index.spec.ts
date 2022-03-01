import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");
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
const tester3 = {
  id: 69,
  name: "Deleted User",
};

const paymentRequestPaypal = {
  id: 1,
  tester_id: tester1.id,
  amount: 100,
  paypal_email: "john.doe@example.com",
  is_paid: 0,
  request_date: new Date("01/01/1972").toISOString(),
};

const paymentRequestPaypalWithError = {
  id: 2,
  tester_id: tester1.id,
  amount: 100,
  paypal_email: "john.doe@example.com",
  is_paid: 0,
  request_date: new Date("05/05/1970").toISOString(),
  update_date: new Date("05/05/1970").toISOString(),
  error_message: "Error message",
};

const paymentRequestWise = {
  id: 3,
  tester_id: tester2.id,
  amount: 100,
  iban: "DE12345678901234567890",
  is_paid: 0,
  request_date: new Date("01/05/1970").toISOString(),
};

const paymentRequestWiseWithError = {
  id: 4,
  tester_id: tester2.id,
  amount: 100,
  iban: "DE12345678901234567890",
  is_paid: 0,
  request_date: new Date("01/06/1970").toISOString(),
  update_date: new Date("05/06/1970").toISOString(),
  error_message: "Error message",
};
const paymentRequestWisePaid = {
  id: 5,
  tester_id: tester2.id,
  amount: 69,
  iban: "DE12345678901234567890",
  is_paid: 1,
  request_date: new Date("01/06/1975").toISOString(),
  update_date: new Date("05/10/1975").toISOString(),
};
const paymentRequestInvalid = {
  id: 6,
  tester_id: tester1.id,
  amount: 69,
  is_paid: 0,
  request_date: new Date("01/06/2000").toISOString(),
};
const paymentRequestOldUser = {
  id: 7,
  tester_id: tester3.id,
  amount: 6969,
  is_paid: 0,
  iban: "DE12345678901234567869",
  request_date: new Date("01/06/2000").toISOString(),
};
const paymentRequestOldUserWithError = {
  id: 8,
  tester_id: tester3.id,
  amount: 6969,
  is_paid: 0,
  iban: "DE12345678901234567869",
  request_date: new Date("01/06/2000").toISOString(),
  update_date: new Date("05/06/1970").toISOString(),
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
        "request_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ",
        "update_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
        "error_message text",
        "is_paid BOOL",
      ]);

      await sqlite3.run(`
      CREATE TRIGGER "on_update__update_date"
        BEFORE UPDATE ON "wp_appq_payment_request" FOR EACH ROW 
        BEGIN
        UPDATE wp_appq_payment_request set update_date = CURRENT_TIMESTAMP where id = NEW.id;
        END`);

      await sqlite3.insert("wp_appq_evd_profile", tester1);
      await sqlite3.insert("wp_appq_evd_profile", tester2);
      await sqlite3.insert("wp_appq_evd_profile", tester3);

      await sqlite3.insert("wp_appq_payment_request", paymentRequestPaypal);
      await sqlite3.insert("wp_appq_payment_request", paymentRequestWise);
      await sqlite3.insert("wp_appq_payment_request", paymentRequestWisePaid);
      await sqlite3.insert("wp_appq_payment_request", paymentRequestInvalid);
      await sqlite3.insert("wp_appq_payment_request", paymentRequestOldUser);
      await sqlite3.insert(
        "wp_appq_payment_request",
        paymentRequestOldUserWithError
      );
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
  afterAll(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.dropTable("wp_appq_evd_profile");
      await sqlite3.dropTable("wp_appq_payment_request");
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
        {
          created: new Date(paymentRequestWisePaid.request_date)
            .getTime()
            .toString(),
          updated: new Date(paymentRequestWisePaid.update_date)
            .getTime()
            .toString(),
          id: paymentRequestWisePaid.id,
          amount: {
            value: paymentRequestWisePaid.amount,
            currency: "EUR",
          },
          type: "transferwise",
          tryber: tester2,
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
      1, 2, 3, 4, 5,
    ]);
    const responseDesc = await request(app)
      .get("/payments?order=DESC")
      .set("authorization", "Bearer admin");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.items.map((item: any) => item.id)).toEqual([
      5, 4, 3, 2, 1,
    ]);
  });
  it("Should order based on id if orderBy is id", async () => {
    const response = await request(app)
      .get("/payments?orderBy=id")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body.items.map((item: any) => item.id)).toEqual([
      1, 2, 3, 4, 5,
    ]);
    const responseAsc = await request(app)
      .get("/payments?orderBy=id&order=ASC")
      .set("authorization", "Bearer admin");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.items.map((item: any) => item.id)).toEqual([
      1, 2, 3, 4, 5,
    ]);
    const responseDesc = await request(app)
      .get("/payments?orderBy=id&order=DESC")
      .set("authorization", "Bearer admin");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.items.map((item: any) => item.id)).toEqual([
      5, 4, 3, 2, 1,
    ]);
  });
  it("Should order based on creation time if orderBy is created", async () => {
    const response = await request(app)
      .get("/payments?orderBy=created")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body.items.map((item: any) => item.id)).toEqual([
      3, 4, 2, 1, 5,
    ]);
    const responseAsc = await request(app)
      .get("/payments?orderBy=created&order=ASC")
      .set("authorization", "Bearer admin");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.items.map((item: any) => item.id)).toEqual([
      3, 4, 2, 1, 5,
    ]);
    const responseDesc = await request(app)
      .get("/payments?orderBy=created&order=DESC")
      .set("authorization", "Bearer admin");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.items.map((item: any) => item.id)).toEqual([
      5, 1, 2, 4, 3,
    ]);
  });
  it("Should return 400 if status is not failed and orderBy is updated", async () => {
    const response = await request(app)
      .get("/payments?orderBy=updated")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(400);
    const responsePending = await request(app)
      .get("/payments?orderBy=updated&status=pending")
      .set("authorization", "Bearer admin");
    expect(responsePending.status).toBe(400);
  });
  it("Should return payments with error if status is failed", async () => {
    const response = await request(app)
      .get("/payments?status=failed")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      items: [
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
  it("Should return payments not paid if status is pending", async () => {
    const response = await request(app)
      .get("/payments?status=pending")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
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
      ],
    });
  });
  it("Should order based on updated time if orderBy is updated and status is failed", async () => {
    const response = await request(app)
      .get("/payments?orderBy=updated&status=failed")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body.items.map((item: any) => item.id)).toEqual([2, 4]);
    const responseAsc = await request(app)
      .get("/payments?orderBy=updated&status=failed&order=ASC")
      .set("authorization", "Bearer admin");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.items.map((item: any) => item.id)).toEqual([2, 4]);
    const responseDesc = await request(app)
      .get("/payments?orderBy=updated&status=failed&order=DESC")
      .set("authorization", "Bearer admin");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.items.map((item: any) => item.id)).toEqual([4, 2]);
  });
  it("Should return 2 results if is set limit parameter with limit = 2", async () => {
    const response = await request(app)
      .get("/payments?limit=2")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body.items.map((item: any) => item.id)).toEqual([1, 2]);
    const responseASC = await request(app)
      .get("/payments?limit=2&order=ASC")
      .set("authorization", "Bearer admin");
    expect(responseASC.status).toBe(200);
    expect(responseASC.body.items.map((item: any) => item.id)).toEqual([1, 2]);
    const responseDESC = await request(app)
      .get("/payments?limit=2&order=DESC")
      .set("authorization", "Bearer admin");
    expect(responseDESC.status).toBe(200);
    expect(responseDESC.body.items.map((item: any) => item.id)).toEqual([5, 4]);
  });
  it("Should skip the first result if is set start parameter with start = 1", async () => {
    const response = await request(app)
      .get("/payments?start=1")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body.items.map((item: any) => item.id)).toEqual([
      2, 3, 4, 5,
    ]);
    const responseASC = await request(app)
      .get("/payments?start=1&order=ASC")
      .set("authorization", "Bearer admin");
    expect(responseASC.status).toBe(200);
    expect(responseASC.body.items.map((item: any) => item.id)).toEqual([
      2, 3, 4, 5,
    ]);
    const responseDESC = await request(app)
      .get("/payments?start=1&order=DESC")
      .set("authorization", "Bearer admin");
    expect(responseDESC.status).toBe(200);
    expect(responseDESC.body.items.map((item: any) => item.id)).toEqual([
      4, 3, 2, 1,
    ]);
  });
  it("Should skip the first result and limit 2 results if are set start and limit parameters with start 1, limit 2", async () => {
    const response = await request(app)
      .get("/payments?start=1&limit=2")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body.items.map((item: any) => item.id)).toEqual([2, 3]);
    const responseASC = await request(app)
      .get("/payments?start=1&limit=2&order=ASC")
      .set("authorization", "Bearer admin");
    expect(responseASC.status).toBe(200);
    expect(responseASC.body.items.map((item: any) => item.id)).toEqual([2, 3]);
    const responseDESC = await request(app)
      .get("/payments?start=1&limit=2&order=DESC")
      .set("authorization", "Bearer admin");
    expect(responseDESC.status).toBe(200);
    expect(responseDESC.body.items.map((item: any) => item.id)).toEqual([4, 3]);
  });
  it("Should return the size that is equal to number of results", async () => {
    const response = await request(app)
      .get("/payments")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body.size).toBe(response.body.items.length);
    const responseStart = await request(app)
      .get("/payments?start=2&limit=2")
      .set("authorization", "Bearer admin");
    expect(responseStart.status).toBe(200);
    expect(responseStart.body.size).toBe(responseStart.body.items.length);
    const responsePending = await request(app)
      .get("/payments?status=pending")
      .set("authorization", "Bearer admin");
    expect(responsePending.status).toBe(200);
    expect(responsePending.body.size).toBe(responsePending.body.items.length);
  });
  it("Should return number of skipped elements", async () => {
    const response = await request(app)
      .get("/payments")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body.start).toBe(0);
    const responseStart = await request(app)
      .get("/payments?start=2")
      .set("authorization", "Bearer admin");
    expect(responseStart.status).toBe(200);
    expect(responseStart.body.start).toBe(2);
  });
  it("Should return the size of limit if limit is set", async () => {
    const response = await request(app)
      .get("/payments?limit=50")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body.limit).toBe(50);
    const responseNoLimit = await request(app)
      .get("/payments")
      .set("authorization", "Bearer admin");
    expect(responseNoLimit.status).toBe(200);
    expect(responseNoLimit.body).not.toHaveProperty("limit");
  });
  it("Should return the total number of elements if limit is set", async () => {
    const response = await request(app)
      .get("/payments?limit=1")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("total");
    expect(response.body.total).toBe(5);
    const responseNoLimit = await request(app)
      .get("/payments")
      .set("authorization", "Bearer admin");
    expect(responseNoLimit.status).toBe(200);
    expect(responseNoLimit.body).not.toHaveProperty("total");
    const responseFail = await request(app)
      .get("/payments?status=failed&limit=1")
      .set("authorization", "Bearer admin");
    expect(responseFail.status).toBe(200);
    expect(responseFail.body.total).toBe(2);
    const responsePending = await request(app)
      .get("/payments?status=pending&limit=1")
      .set("authorization", "Bearer admin");
    expect(responsePending.status).toBe(200);
    expect(responsePending.body.total).toBe(2);
  });
});

describe("Route GET payments when no data", () => {
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
      resolve(null);
    });
  });

  afterAll(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.dropTable("wp_appq_evd_profile");
      await sqlite3.dropTable("wp_appq_payment_request");
      resolve(null);
    });
  });
  it("Should return 404", async () => {
    const response = await request(app)
      .get("/payments")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(404);
  });
});
