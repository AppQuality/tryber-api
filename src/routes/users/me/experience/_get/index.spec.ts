import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");
const tester1 = {
  id: 1,
  name: "John",
  surname: "Doe",
  wp_user_id: 1,
};
const user1 = {
  ID: 1,
};
const campaign1 = {
  id: 1,
  title: "Campaign 1",
};
const campaign2 = {
  id: 2,
  title: "Campaign 2",
};
const exp1 = {
  id: 1,
  amount: 10,
  reason: "reason findme 1",
  campaign_id: campaign1.id,
  activity_id: 1,
  creation_date: new Date("2020-01-02").toISOString(),
  tester_id: tester1.id,
};
const exp2 = {
  id: 2,
  amount: 10,
  reason: "reason 2",
  campaign_id: campaign1.id,
  activity_id: 1,
  creation_date: new Date("2020-01-03").toISOString(),
  tester_id: tester1.id,
};
const exp3 = {
  id: 3,
  amount: 10,
  reason: "reason findme 3 ",
  campaign_id: campaign2.id,
  activity_id: 1,
  creation_date: new Date("2020-01-01").toISOString(),
  tester_id: tester1.id,
};

describe("Route GET users-me-experience", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.createTable("wp_appq_evd_profile", [
        "id INTEGER PRIMARY KEY",
        "name VARCHAR(255)",
        "wp_user_id INTEGER",
        "surname VARCHAR(255)",
      ]);
      await sqlite3.createTable("wp_users", ["ID INTEGER PRIMARY KEY"]);
      await sqlite3.createTable("wp_appq_evd_campaign", [
        "id INTEGER PRIMARY KEY",
        "title VARCHAR(255)",
      ]);
      await sqlite3.createTable("wp_appq_exp_points", [
        "id INTEGER PRIMARY KEY",
        "tester_id INTEGER",
        "activity_id INTEGER",
        "campaign_id INTEGER",
        "reason VARCHAR(255)",
        "amount INTEGER",
        "creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      ]);

      await sqlite3.insert("wp_appq_evd_profile", tester1);
      await sqlite3.insert("wp_users", user1);
      await sqlite3.insert("wp_appq_evd_campaign", campaign1);
      await sqlite3.insert("wp_appq_evd_campaign", campaign2);
      await sqlite3.insert("wp_appq_exp_points", exp1);
      await sqlite3.insert("wp_appq_exp_points", exp2);
      await sqlite3.insert("wp_appq_exp_points", exp3);

      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.dropTable("wp_appq_evd_profile");
      await sqlite3.dropTable("wp_users");
      await sqlite3.dropTable("wp_appq_evd_campaign");
      await sqlite3.dropTable("wp_appq_exp_points");
      resolve(null);
    });
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/users/me/experience");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged if there are experience points available", async () => {
    const response = await request(app)
      .get("/users/me/experience")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should answer with a list of experience points", async () => {
    const response = await request(app)
      .get("/users/me/experience")
      .set("Authorization", "Bearer tester");
    expect(response.body).toMatchObject({
      results: [
        {
          activity: { id: exp1.activity_id },
          amount: exp1.amount,
          campaign: { id: campaign1.id, title: campaign1.title },
          date: exp1.creation_date.split("T")[0],
          id: exp1.id,
          note: exp1.reason,
        },
        {
          activity: { id: exp2.activity_id },
          amount: exp2.amount,
          campaign: { id: campaign1.id, title: campaign1.title },
          date: exp2.creation_date.split("T")[0],
          id: exp2.id,
          note: exp2.reason,
        },
        {
          activity: { id: exp3.activity_id },
          amount: exp3.amount,
          campaign: { id: campaign2.id, title: campaign2.title },
          date: exp3.creation_date.split("T")[0],
          id: exp3.id,
          note: exp3.reason,
        },
      ],
    });
  });
  it("Should return 2 results if is set limit parameter with limit = 2", async () => {
    const response = await request(app)
      .get("/users/me/experience?limit=2")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.map((item: any) => item.id)).toEqual([1, 2]);
  });
  it("Should skip the first result and limit 1 results if are set start and limit parameters with start 1, limit 1", async () => {
    const response = await request(app)
      .get("/users/me/experience?start=1&limit=1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.map((item: any) => item.id)).toEqual([2]);
  });
  it("Should order based on id if orderBy is id", async () => {
    const response = await request(app)
      .get("/users/me/experience?orderBy=id")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.map((item: any) => item.id)).toEqual([
      1, 2, 3,
    ]);
    const responseAsc = await request(app)
      .get("/users/me/experience?orderBy=id&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.results.map((item: any) => item.id)).toEqual([
      1, 2, 3,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/experience?orderBy=id&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.results.map((item: any) => item.id)).toEqual([
      3, 2, 1,
    ]);
  });
  it("Should order based on date if orderBy is date", async () => {
    const response = await request(app)
      .get("/users/me/experience?orderBy=date")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.map((item: any) => item.id)).toEqual([
      3, 1, 2,
    ]);
    const responseAsc = await request(app)
      .get("/users/me/experience?orderBy=date&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.results.map((item: any) => item.id)).toEqual([
      3, 1, 2,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/experience?orderBy=date&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.results.map((item: any) => item.id)).toEqual([
      2, 1, 3,
    ]);
  });
  it("Should show only exp from campaign 2 if filterBy[campaign]=2", async () => {
    const response = await request(app)
      .get("/users/me/experience?filterBy[campaign]=2")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.map((item: any) => item.id)).toEqual([3]);
  });
  it('Should show only exp with "findme" in reason text if searchBy=note and search=findme', async () => {
    const response = await request(app)
      .get("/users/me/experience?searchBy=note&search=findme")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.map((item: any) => item.id)).toEqual([1, 3]);
  });
});
