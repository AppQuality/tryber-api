import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");
const tester1 = {
  id: 1,
  name: "John",
  surname: "Doe",
  email: "jhon.doe@example.com",
  wp_user_id: 1,
  is_verified: 0,
};
const wpTester1 = {
  ID: 1,
  user_login: "john_doe",
};

describe("Route GET users-me", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.createTable("wp_appq_evd_profile", [
        "id INTEGER PRIMARY KEY",
        "name VARCHAR(255)",
        "surname VARCHAR(255)",
        "email VARCHAR(255)",
        "wp_user_id INTEGER ",
        "is_verified INTEGER DEFAULT 0",
      ]);

      await sqlite3.createTable("wp_users", [
        "ID INTEGER PRIMARY KEY",
        "user_login VARCHAR(255)",
      ]);
      await sqlite3.insert("wp_appq_evd_profile", tester1);
      await sqlite3.insert("wp_users", wpTester1);

      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.dropTable("wp_appq_evd_profile");
      await sqlite3.dropTable("wp_users");

      resolve(null);
    });
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/users/me");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged in", async () => {
    const response = await request(app)
      .get("/users/me")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });
  it("Should return at least tryber id and tryber role", async () => {
    const response = await request(app)
      .get("/users/me")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: tester1.id, role: "tester" });
  });
  it("Should return an object with role 'tester' if the user is without special permission", async () => {
    const response = await request(app)
      .get("/users/me")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("role");
    expect(response.body.role).toBe("tester");
  });
});
