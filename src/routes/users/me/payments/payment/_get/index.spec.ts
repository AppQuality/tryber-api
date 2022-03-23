import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");

const payment1 = {
  id: 1,
  tester_id: 1,
  amount: 40,
  creation_date: new Date("01/01/1972").toISOString(),
  work_type_id: 1,
  request_id: 1,
  campaign_id: 1,
};
const payment2 = {
  id: 2,
  tester_id: 1,
  amount: 100,
  creation_date: new Date("01/02/1972").toISOString(),
  work_type_id: 2,
  request_id: 1,
  campaign_id: 2,
};
const campaign1 = {
  id: 1,
  title: "Campaign 1",
};
const campaign2 = {
  id: 2,
  title: "Campaign 2",
};
const work_type1 = {
  id: 1,
  work_type: "A - Work type",
};
const work_type2 = {
  id: 2,
  work_type: "Z - Work type",
};

describe("GET /users/me/payments/{payment}", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.createTable("wp_appq_payment", [
        "id INTEGER PRIMARY KEY",
        "tester_id INTEGER",
        "amount DECIMAL(11,2)",
        "creation_date DATETIME",
        "work_type_id INTEGER",
        "request_id INTEGER",
        "campaign_id INTEGER",
      ]);

      await sqlite3.createTable("wp_appq_evd_campaign", [
        "id INTEGER PRIMARY KEY",
        "title VARCHAR(255)",
      ]);

      await sqlite3.createTable("wp_appq_payment_work_types", [
        "id INTEGER PRIMARY KEY",
        "work_type VARCHAR(255)",
      ]);

      await sqlite3.insert("wp_appq_payment", payment1);
      await sqlite3.insert("wp_appq_payment", payment2);
      await sqlite3.insert("wp_appq_evd_campaign", campaign1);
      await sqlite3.insert("wp_appq_evd_campaign", campaign2);
      await sqlite3.insert("wp_appq_payment_work_types", work_type1);
      await sqlite3.insert("wp_appq_payment_work_types", work_type2);

      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.dropTable("wp_appq_payment");
      await sqlite3.dropTable("wp_appq_evd_campaign");
      await sqlite3.dropTable("wp_appq_payment_work_types");
      resolve(null);
    });
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/users/me/payments/1");
    console.log(response.body);
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if the tester has the payment", async () => {
    const response = await request(app)
      .get("/users/me/payments/1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should answer 404 if the tester doesn't have the payment", async () => {
    const response = await request(app)
      .get("/users/me/payments/2")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(404);
  });
  it("Should return a list of payments ordered by date DESC", async () => {
    const response = await request(app)
      .get("/users/me/payments/1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results).toEqual([
      {
        activity: `[CP-${campaign2.id}] ${campaign2.title}`,
        type: work_type2.work_type,
        amount: { value: payment2.amount, currency: "EUR" },
        date: payment2.creation_date.substring(0, 10),
      },
      {
        activity: `[CP-${campaign1.id}] ${campaign1.title}`,
        type: work_type1.work_type,
        amount: { value: payment1.amount, currency: "EUR" },
        date: payment1.creation_date.substring(0, 10),
      },
    ]);
  });

  it("Should be orderable by date", async () => {
    const response = await request(app)
      .get("/users/me/payments/1?orderBy=date")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.map((r: { date: string }) => r.date)).toEqual([
      payment2.creation_date.substring(0, 10),
      payment1.creation_date.substring(0, 10),
    ]);
    const responseDesc = await request(app)
      .get("/users/me/payments/1?orderBy=date&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(
      responseDesc.body.results.map((r: { date: string }) => r.date)
    ).toEqual([
      payment2.creation_date.substring(0, 10),
      payment1.creation_date.substring(0, 10),
    ]);
    const responseAsc = await request(app)
      .get("/users/me/payments/1?orderBy=date&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(
      responseAsc.body.results.map((r: { date: string }) => r.date)
    ).toEqual([
      payment1.creation_date.substring(0, 10),
      payment2.creation_date.substring(0, 10),
    ]);
  });

  it("Should be orderable by amount", async () => {
    const response = await request(app)
      .get("/users/me/payments/1?orderBy=amount")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(
      response.body.results.map(
        (r: { amount: { value: number } }) => r.amount.value
      )
    ).toEqual([payment2.amount, payment1.amount]);
    const responseDesc = await request(app)
      .get("/users/me/payments/1?orderBy=amount&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(
      responseDesc.body.results.map(
        (r: { amount: { value: number } }) => r.amount.value
      )
    ).toEqual([payment2.amount, payment1.amount]);
    const responseAsc = await request(app)
      .get("/users/me/payments/1?orderBy=amount&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(
      responseAsc.body.results.map(
        (r: { amount: { value: number } }) => r.amount.value
      )
    ).toEqual([payment1.amount, payment2.amount]);
  });

  it("Should be orderable by activity name", async () => {
    const response = await request(app)
      .get("/users/me/payments/1?orderBy=activity")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(
      response.body.results.map((r: { activity: string }) => r.activity)
    ).toEqual([
      `[CP-${campaign2.id}] ${campaign2.title}`,
      `[CP-${campaign1.id}] ${campaign1.title}`,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/payments/1?orderBy=activity&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(
      responseDesc.body.results.map((r: { activity: string }) => r.activity)
    ).toEqual([
      `[CP-${campaign2.id}] ${campaign2.title}`,
      `[CP-${campaign1.id}] ${campaign1.title}`,
    ]);
    const responseAsc = await request(app)
      .get("/users/me/payments/1?orderBy=activity&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(
      responseAsc.body.results.map((r: { activity: string }) => r.activity)
    ).toEqual([
      `[CP-${campaign1.id}] ${campaign1.title}`,
      `[CP-${campaign2.id}] ${campaign2.title}`,
    ]);
  });

  it("Should be orderable by activity type", async () => {
    const response = await request(app)
      .get("/users/me/payments/1?orderBy=type")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.map((r: { type: string }) => r.type)).toEqual([
      work_type2.work_type,
      work_type1.work_type,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/payments/1?orderBy=type&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(
      responseDesc.body.results.map((r: { type: string }) => r.type)
    ).toEqual([work_type2.work_type, work_type1.work_type]);
    const responseAsc = await request(app)
      .get("/users/me/payments/1?orderBy=type&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(
      responseAsc.body.results.map((r: { type: string }) => r.type)
    ).toEqual([work_type1.work_type, work_type2.work_type]);
  });
});
