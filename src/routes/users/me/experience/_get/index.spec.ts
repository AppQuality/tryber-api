import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");
const tester1 = {
  id: 1,
  wp_user_id: 1,
};
const campaign1 = {
  id: 1,
  title: "This is the Campaign title",
};
const campaign2 = {
  id: 2,
  title: "This is the Campaign title",
};
const exp1 = {
  id: 1,
  tester_id: tester1.id,
  activity_id: 1,
  reason: "I'm a reason",
  creation_date: "1970-01-01 00:00:00",
  amount: 20,
  campaign_id: campaign1.id,
};
const exp2 = {
  id: 2,
  tester_id: tester1.id,
  activity_id: 1,
  reason: "I'm a reason",
  creation_date: "1970-01-01 00:00:00",
  amount: 10,
  campaign_id: campaign2.id,
};

describe("GET /users/me/experience", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.createTable("wp_appq_evd_profile", [
        "id INTEGER PRIMARY KEY",
        "wp_user_id INTEGER ",
      ]);
      await sqlite3.createTable("wp_appq_exp_points", [
        "id INTEGER PRIMARY KEY",
        "tester_id INTEGER",
        "activity_id INTEGER",
        "reason VARCHAR(255)",
        "creation_date DATETIME",
        "amount INTEGER",
        "campaign_id INTEGER",
      ]);
      await sqlite3.createTable("wp_appq_evd_campaign", [
        "id INTEGER PRIMARY KEY",
        "title VARCHAR(255)",
      ]);
      await sqlite3.insert("wp_appq_exp_points", exp1);
      await sqlite3.insert("wp_appq_exp_points", exp2);
      await sqlite3.insert("wp_appq_evd_campaign", campaign1);
      await sqlite3.insert("wp_appq_evd_campaign", campaign2);
      await sqlite3.insert("wp_appq_evd_profile", tester1);

      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.dropTable("wp_appq_exp_points");
      await sqlite3.dropTable("wp_appq_evd_campaign");
      await sqlite3.dropTable("wp_appq_evd_profile");

      resolve(null);
    });
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/users/me/experience");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged in tryber", async () => {
    const response = await request(app)
      .get("/users/me/experience")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      results: [
        {
          id: exp1.id,
          activity: { id: exp1.activity_id },
          campaign: { id: campaign1.id, title: campaign1.title },
          date: "1970-01-01",
          amount: exp1.amount,
          note: exp1.reason,
        },
        {
          id: exp2.id,
          activity: {
            id: exp2.activity_id,
          },
          date: "1970-01-01",
          campaign: { id: campaign2.id, title: campaign2.title },
          amount: exp2.amount,
          note: exp2.reason,
        },
      ],
      size: 2,
      start: 0,
      sum: exp1.amount + exp2.amount,
    });
  });

  it("Should order based on order parameters", async () => {
    const responseAsc = await request(app)
      .get("/users/me/experience?order=ASC&orderBy=id")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.results.map((item: any) => item.id)).toEqual([
      1, 2,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/experience?order=DESC&orderBy=id")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.results.map((item: any) => item.id)).toEqual([
      2, 1,
    ]);
  });

  it("Should return only campaign 1 experience points if filterBy[campaign]=1", async () => {
    const response = await request(app)
      .get("/users/me/experience?filterBy[campaign]=1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(
      response.body.results.map((item: { id: number }) => item.id)
    ).toEqual([exp1.id]);
  });

  it("Should return 1 result if is set limit parameter with limit = 1", async () => {
    const response = await request(app)
      .get("/users/me/experience?limit=1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.map((item: any) => item.id)).toEqual([1]);
    const responseASC = await request(app)
      .get("/users/me/experience?limit=1&order=ASC&orderBy=id")
      .set("authorization", "Bearer tester");
    expect(responseASC.status).toBe(200);
    expect(responseASC.body.results.map((item: any) => item.id)).toEqual([1]);
    const responseDESC = await request(app)
      .get("/users/me/experience?limit=1&order=DESC&orderBy=id")
      .set("authorization", "Bearer tester");
    expect(responseDESC.status).toBe(200);
    expect(responseDESC.body.results.map((item: any) => item.id)).toEqual([2]);
  });
});

describe("GET /users/me/experience - user without experience points", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.createTable("wp_appq_evd_profile", [
        "id INTEGER PRIMARY KEY",
        "wp_user_id INTEGER ",
      ]);
      await sqlite3.createTable("wp_appq_exp_points", [
        "id INTEGER PRIMARY KEY",
        "activity_id INTEGER",
        "tester_id INTEGER",
        "reason VARCHAR(255)",
        "creation_date DATETIME",
        "amount INTEGER",
        "campaign_id INTEGER",
      ]);
      await sqlite3.createTable("wp_appq_evd_campaign", [
        "id INTEGER PRIMARY KEY",
        "title VARCHAR(255)",
      ]);
      await sqlite3.insert("wp_appq_evd_campaign", campaign1);
      await sqlite3.insert("wp_appq_evd_profile", tester1);
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.dropTable("wp_appq_exp_points");
      await sqlite3.dropTable("wp_appq_evd_campaign");
      await sqlite3.dropTable("wp_appq_evd_profile");

      resolve(null);
    });
  });

  it("Should answer 404 if the tryber hasn't experience entries", async () => {
    const response = await request(app)
      .get("/users/me/experience")
      .set("authorization", "Bearer tester");
    console.log(response.body);
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      element: "experience",
      id: 0,
      message: "Error on finding experience points",
    });
  });
});
