import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");
const user = {
  ID: 1,
};
const tester1 = {
  id: 1,
  wp_user_id: user.ID,
  name: "John",
  surname: "Doe",
  email: "john.doe@example.com",
  birth_date: "1970-01-01",
  sex: -1,
  phone_number: "+00000000000",
  city: "Nowhere",
  address: "No street",
  postal_code: "00000",
  province: "NW",
  country: "NoPlace",
  booty: 100,
  pending_booty: 200,
  address_number: "0",
  u2b_login_token: "u2b_token",
  fb_login_token: "fb_token",
  ln_login_token: "ln_token",
  total_exp_pts: "999",
  employment_id: 1,
  education_id: 1,
  state: "NoState",
  country_code: "NC",
};

describe("Route DELETE users/me", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.createTable("wp_users", ["ID INTEGER PRIMARY KEY"]);
      await sqlite3.createTable("wp_usermeta", [
        "id INTEGER PRIMARY KEY",
        "user_id INTEGER NOT NULL",
      ]);
      await sqlite3.createTable("wp_appq_custom_user_field_data", [
        "id INTEGER PRIMARY KEY",
        "profile_id INTEGER NOT NULL",
      ]);
      await sqlite3.createTable("wp_appq_fiscal_profile", [
        "id INTEGER PRIMARY KEY",
        "tester_id INTEGER NOT NULL",
        "is_active INTEGER NOT NULL",
      ]);
      await sqlite3.createTable("wp_crowd_appq_device", [
        "id INTEGER PRIMARY KEY",
        "id_profile INTEGER NOT NULL",
        "enabled INTEGER NOT NULL",
      ]);
      await sqlite3.createTable("wp_appq_user_deletion_reason", [
        "tester_id INTEGER NOT NULL",
        "reason TEXT NOT NULL",
      ]);

      await sqlite3.createTable("wp_appq_evd_profile", [
        "id INTEGER PRIMARY KEY",
        "wp_user_id INTEGER",
        "name VARCHAR(255)",
        "surname VARCHAR(255)",
        "email VARCHAR(255)",
        "birth_date DATETIME",
        "sex INTEGER",
        "phone_number VARCHAR(255)",
        "city VARCHAR(255)",
        "address VARCHAR(255)",
        "postal_code VARCHAR(255)",
        "province VARCHAR(255)",
        "country VARCHAR(255)",
        "booty INTEGER",
        "pending_booty INTEGER",
        "address_number VARCHAR(255)",
        "u2b_login_token VARCHAR(255)",
        "fb_login_token VARCHAR(255)",
        "ln_login_token VARCHAR(255)",
        "total_exp_pts INTEGER",
        "employment_id INTEGER",
        "education_id INTEGER",
        "state VARCHAR(255)",
        "country_code VARCHAR(255)",
      ]);

      await sqlite3.insert("wp_appq_evd_profile", tester1);
      await sqlite3.insert("wp_users", user);
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve, reject) => {
      try {
        await sqlite3.dropTable("wp_appq_evd_profile");
        await sqlite3.dropTable("wp_users");
        await sqlite3.dropTable("wp_appq_custom_user_field_data");
        await sqlite3.dropTable("wp_appq_fiscal_profile");
        resolve(null);
      } catch (err) {
        reject(err);
      }
    });
  });
  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).delete("/users/me");
    expect(response.status).toBe(403);
  });
  it('Should set tester name as "Deleted User"', async () => {
    const response = await request(app)
      .delete("/users/me")
      .send({ reason: "REASON" })
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const userData = await sqlite3.get(
      `SELECT * FROM wp_appq_evd_profile WHERE id = ${tester1.id} `
    );
    expect(userData.name).toBe("Deleted User");
  });
  it("Should clear birth date", async () => {
    const response = await request(app)
      .delete("/users/me")
      .send({ reason: "REASON" })
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const userData = await sqlite3.get(
      `SELECT * FROM wp_appq_evd_profile WHERE id = ${tester1.id} `
    );
    expect(userData.birth_date).toBe(null);
  });
});
