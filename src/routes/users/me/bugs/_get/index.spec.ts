import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");

const campaign1 = {
  id: 1,
  title: "This is the Campaign title",
};

const campaign2 = {
  id: 2,
  title: "This is the Campaign title",
};
const bug1 = {
  id: 1,
  message: "This is the bug message",
  campaign_id: campaign1.id,
  status_id: 1,
  wp_user_id: 1,
  severity_id: 1,
};
const bug2 = {
  id: 2,
  message: "This is the bug message",
  campaign_id: campaign2.id,
  status_id: 1,
  wp_user_id: 1,
  severity_id: 1,
};
const severity1 = {
  id: 1,
  name: "This is the Severity name",
};
const status1 = {
  id: 1,
  name: "This is the Status name",
};

describe("GET /users/me/bugs", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.createTable("wp_appq_evd_bug", [
        "id INTEGER PRIMARY KEY",
        "message VARCHAR(255)",
        "campaign_id INTEGER",
        "status_id INTEGER",
        "wp_user_id INTEGER",
        "severity_id INTEGER",
      ]);
      await sqlite3.createTable("wp_appq_evd_campaign", [
        "id INTEGER PRIMARY KEY",
        "title VARCHAR(255)",
      ]);
      await sqlite3.createTable("wp_appq_evd_severity", [
        "id INTEGER PRIMARY KEY",
        "name VARCHAR(255)",
      ]);
      await sqlite3.createTable("wp_appq_evd_bug_status", [
        "id INTEGER PRIMARY KEY",
        "name VARCHAR(255)",
      ]);
      await sqlite3.insert("wp_appq_evd_bug", bug1);
      await sqlite3.insert("wp_appq_evd_bug", bug2);
      await sqlite3.insert("wp_appq_evd_campaign", campaign1);
      await sqlite3.insert("wp_appq_evd_campaign", campaign2);
      await sqlite3.insert("wp_appq_evd_severity", severity1);
      await sqlite3.insert("wp_appq_evd_bug_status", status1);

      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.dropTable("wp_appq_evd_bug");
      await sqlite3.dropTable("wp_appq_evd_campaign");
      await sqlite3.dropTable("wp_appq_evd_severity");
      await sqlite3.dropTable("wp_appq_evd_bug_status");

      resolve(null);
    });
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/users/me/bugs");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged in tryber", async () => {
    const response = await request(app)
      .get("/users/me/bugs")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results[0]).toMatchObject({
      id: bug1.id,
      severity: { id: severity1.id, name: severity1.name },
      status: { id: 1, name: status1.name },
      campaign: { id: 1, name: campaign1.title },
      title: bug1.message,
    });
  });

  it("Should order based on order parameters", async () => {
    const responseAsc = await request(app)
      .get("/users/me/bugs?order=ASC&orderBy=id")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.results.map((item: any) => item.id)).toEqual([
      1, 2,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/bugs?order=DESC&orderBy=id")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.results.map((item: any) => item.id)).toEqual([
      2, 1,
    ]);
  });

  it("Should return 1 result if is set limit parameter with limit = 1", async () => {
    const response = await request(app)
      .get("/users/me/bugs?limit=1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.map((item: any) => item.id)).toEqual([1]);
    const responseASC = await request(app)
      .get("/users/me/bugs?limit=1&order=ASC&orderBy=id")
      .set("authorization", "Bearer tester");
    expect(responseASC.status).toBe(200);
    expect(responseASC.body.results.map((item: any) => item.id)).toEqual([1]);
    const responseDESC = await request(app)
      .get("/users/me/bugs?limit=1&order=DESC&orderBy=id")
      .set("authorization", "Bearer tester");
    expect(responseDESC.status).toBe(200);
    expect(responseDESC.body.results.map((item: any) => item.id)).toEqual([2]);
  });

  it("Should return only campaign 1 bugs if filterBy[campaign]=1", async () => {
    const response = await request(app)
      .get("/users/me/bugs?filterBy[campaign]=1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(
      response.body.results.map((item: { id: number }) => item.id)
    ).toEqual([bug1.id]);
  });
});

describe("GET /users/me/bugs - user without bugs", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.createTable("wp_appq_evd_profile", [
        "id INTEGER PRIMARY KEY",
        "wp_user_id INTEGER",
      ]);
      await sqlite3.createTable("wp_appq_evd_bug", [
        "id INTEGER PRIMARY KEY",
        "message VARCHAR(255)",
        "campaign_id INTEGER",
        "status_id INTEGER",
        "wp_user_id INTEGER",
        "severity_id INTEGER",
      ]);
      await sqlite3.createTable("wp_appq_evd_campaign", [
        "id INTEGER PRIMARY KEY",
        "title VARCHAR(255)",
      ]);
      await sqlite3.createTable("wp_appq_evd_severity", [
        "id INTEGER PRIMARY KEY",
        "name VARCHAR(255)",
      ]);
      await sqlite3.createTable("wp_appq_evd_bug_status", [
        "id INTEGER PRIMARY KEY",
        "name VARCHAR(255)",
      ]);

      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.dropTable("wp_appq_evd_profile");
      await sqlite3.dropTable("wp_appq_evd_bug");
      await sqlite3.dropTable("wp_appq_evd_campaign");
      await sqlite3.dropTable("wp_appq_evd_severity");
      await sqlite3.dropTable("wp_appq_evd_bug_status");

      resolve(null);
    });
  });

  it("Should answer 404 if the tryber hasn't bug", async () => {
    const response = await request(app)
      .get("/users/me/bugs")
      .set("authorization", "Bearer tester");
    console.log(response.body);
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      element: "bugs",
      id: 0,
      message: "Error on finding bugs",
    });
  });
});
