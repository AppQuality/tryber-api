import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");
const tester1 = {
  id: 1,
  wp_user_id: 1,
};
const device1 = {
  id: 1,
  form_factor: "Smartphone",
  model: "Galassy note 3",
  //pc_type: null,
  manufacturer: "Samsungu",
  os_version_id: 11,
  id_profile: 1,
  enabled: 1,
  source_id: 1,
  platform_id: 10,
};
const platform1 = {
  id: 10,
  name: "Androis",
};
const os1 = {
  id: 11,
  display_name: "Lollipoop",
  version_number: "1.0.0",
};

describe("Route GET users-me-devices", () => {
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
      await sqlite3.createTable("wp_appq_evd_platform", [
        "id INTEGER PRIMARY KEY",
        "name VARCHAR(255)",
      ]);
      await sqlite3.createTable("wp_appq_os", [
        "id INTEGER PRIMARY KEY",
        "display_name VARCHAR(255)",
        "version_number VARCHAR(255)",
      ]);

      await sqlite3.insert("wp_appq_evd_profile", tester1);
      await sqlite3.insert("wp_crowd_appq_device", device1);
      await sqlite3.insert("wp_appq_evd_platform", platform1);
      await sqlite3.insert("wp_appq_os", os1);
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.dropTable("wp_appq_evd_profile");
      await sqlite3.dropTable("wp_crowd_appq_device");
      await sqlite3.dropTable("wp_appq_evd_platform");
      await sqlite3.dropTable("wp_appq_os");
      resolve(null);
    });
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/users/me/devices");
    expect(response.status).toBe(403);
  });

  it("Should answer 200 if logged in tryber", async () => {
    const response = await request(app)
      .get("/users/me/devices")
      .set("authorization", "Bearer tester");
    console.log(response.body);
    expect(response.status).toBe(200);
  });
  /*
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
  */
});
