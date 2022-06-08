import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import { data as userLevels } from "@src/__mocks__/mockedDb/levels";
import { data as profileData } from "@src/__mocks__/mockedDb/profile";
import { data as wpUserData } from "@src/__mocks__/mockedDb/wp_users";
import request from "supertest";

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
  address: "No street", //
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
      await sqlite3.insert("wp_appq_evd_profile", tester1);
      //await profileData.basicTester(tester1);
      await wpUserData.basicUser();
      await userLevels.basicLevel();
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve, reject) => {
      try {
        await wpUserData.drop();
        await profileData.drop();
        await userLevels.drop();
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
  it("Should update deletion date", async () => {
    const userData = await sqlite3.get(
      `SELECT * FROM wp_appq_evd_profile WHERE id = 1 `
    );
    const response = await request(app)
      .delete("/users/me")
      .send({ reason: "REASON" })
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const deletedUser = await sqlite3.get(
      `SELECT * FROM wp_appq_evd_profile WHERE id = 1 `
    );
    const expectDate = new Date().toISOString().substring(0, 10);
    expect(userData.deletion_date).not.toEqual(deletedUser.deletion_date);
    expect(deletedUser.deletion_date.substring(0, 10)).toEqual(expectDate);
  });
  it("Should remove user from activity levels", async () => {
    const userLevel = await sqlite3.get(
      `SELECT * FROM wp_appq_activity_level WHERE tester_id = 1 `
    );
    expect(userLevel).toEqual({ id: 1, tester_id: 1, level_id: 10 });

    const response = await request(app)
      .delete("/users/me")
      .send({ reason: "REASON" })
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const deletedUserLevel = await sqlite3.get(
      `SELECT * FROM wp_appq_activity_level WHERE tester_id = 1 `
    );
    expect(deletedUserLevel).toEqual(undefined);
  });
});
