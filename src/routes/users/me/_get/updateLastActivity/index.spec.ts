import sqlite3 from "@src/features/sqlite";

import updateLastActivity from ".";

jest.mock("@src/features/db");

const tester1 = {
  id: 1,
  last_activity: "2022-02-24 14:50:34",
};

describe("updateLastActivity", () => {
  beforeEach(() => {
    return new Promise(async (resolve, reject) => {
      try {
        await sqlite3.createTable("wp_appq_evd_profile", [
          "id INTEGER PRIMARY KEY",
          "last_activity TIMESTAMP",
        ]);
        await sqlite3.insert("wp_appq_evd_profile", tester1);
        resolve(null);
      } catch (err) {
        reject(err);
      }
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve, reject) => {
      try {
        await sqlite3.dropTable("wp_appq_evd_profile");
        resolve(null);
      } catch (err) {
        reject(err);
      }
    });
  });
  it("Should update last_activity with NOW()", async () => {
    await updateLastActivity(tester1.id);
    const now = new Date().toISOString().split(".")[0];
    const res = await sqlite3.get(
      `SELECT last_activity FROM wp_appq_evd_profile WHERE id = ${tester1.id} `
    );
    const lastActivity = new Date(res.last_activity + ".000+00:00")
      .toISOString()
      .split(".")[0];
    expect(lastActivity).toEqual(now);
  });
});
