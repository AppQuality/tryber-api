import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");
const tester1 = {
  id: 1,
  wp_user_id: 1,
};

describe("Route GET users-me-bugs", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.createTable("wp_appq_evd_profile", [
        "id INTEGER PRIMARY KEY",
        "wp_user_id INTEGER",
      ]);
      await sqlite3.createTable("wp_crowd_appq_device", [
        "id INTEGER PRIMARY KEY",
        "form_factor VARCHAR(255)",
        "model VARCHAR(255)",
        "manufacturer VARCHAR(255)",
        "pc_type VARCHAR(255)",
        "os_version_id INTEGER",
        "id_profile INTEGER",
        "source_id INTEGER",
        "platform_id INTEGER",
        "enabled INTEGER",
      ]);

      await sqlite3.insert("wp_appq_evd_profile", tester1);
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.dropTable("wp_appq_evd_profile");
      resolve(null);
    });
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/users/me/bugs");
    expect(response.status).toBe(403);
    console.log(response.statusCode);
  });
});
