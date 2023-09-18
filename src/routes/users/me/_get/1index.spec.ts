import app from "@src/app";
import request from "supertest";
import { tryber } from "@src/features/database";

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const profile = {
  id: 1,
  wp_user_id: 1,
  name: "Jhon",
  surname: "Doe",
  birth_date: "1990-01-01",
  phone_number: "123456789",
  city: "Milan",
  address: "Via Roma 1",
  country: "Italy",
  postal_code: 12345,
  email: "jhondoe@tryber.me",
  employment_id: 1,
  education_id: 1,
  last_login: yesterday.toISOString().slice(0, 19).replace("T", " "),
  last_activity: yesterday.toISOString().slice(0, 19).replace("T", " "),
  sex: 1,
  is_verified: 1,
  total_exp_pts: 9000,
  onboarding_complete: 1,
};
describe("GET /users/me - basic data", () => {
  beforeEach(async () => {
    await tryber.tables.WpAppqEvdProfile.do().insert(profile);
    await tryber.tables.WpUsers.do().insert({ ID: 1, user_login: "jhon.doe" });
  });
  afterEach(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpUsers.do().delete();
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/users/me");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged in tryber", async () => {
    const response = await request(app)
      .get("/users/me")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should update lastActivity", async () => {
    const resPre = await tryber.tables.WpAppqEvdProfile.do().select().first();

    const response = await request(app)
      .get("/users/me")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const resPost = await tryber.tables.WpAppqEvdProfile.do().select().first();
    expect(resPre?.last_activity).not.toEqual(resPost?.last_activity);
    const now = new Date().toISOString().split(".")[0].replace("T", " ");
    expect(resPost?.last_activity.slice(0, -2)).toEqual(now.slice(0, -2));
  });
  it("Should return basic data if fields query is not set", async () => {
    const response = await request(app)
      .get("/users/me")
      .set("authorization", "Bearer tester");
    expect(Object.keys(response.body).length).toEqual(8);
    expect(response.body.id).toBeDefined();
    expect(response.body.name).toBeDefined();
    expect(response.body.surname).toBeDefined();
    expect(response.body.email).toBeDefined();
    expect(response.body.wp_user_id).toBeDefined();
    expect(response.body.is_verified).toBeDefined();
    expect(response.body.username).toBeDefined();
    expect(response.body.role).toBeDefined();
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      name: profile.name,
      surname: profile.surname,
      email: profile.email,
      wp_user_id: profile.wp_user_id,
      is_verified: true,
      username: "jhon.doe",
      role: "tester",
    });
  });
  it("Should return id, role if set an invalid field as fields=random", async () => {
    const response = await request(app)
      .get("/users/me?fields=random")
      .set("authorization", "Bearer tester");
    expect(Object.keys(response.body).length).toEqual(2);
    expect(response.body.id).toBeDefined();
    expect(response.body.role).toBeDefined();
    expect(response.body).toEqual({
      id: 1,
      role: "tester",
    });
  });
});
