import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("Route HEAD users/by-email/{email} - user does not exist", () => {
  it("Should return 400 if email is not valid", async () => {
    const response = await request(app).head("/users/by-email/not@valid@mail");
    expect(response.status).toBe(400);
  });
  it("Should return 404 if user does not exist exist", async () => {
    const response = await request(app).head(
      "/users/by-email/jhon.doe@example.com"
    );
    expect(response.status).toBe(404);
  });
});

describe("Route HEAD users/by-email/{email} - user exist", () => {
  beforeEach(async () => {
    await tryber.tables.WpUsers.do().insert({
      ID: 10,
      user_email: "jhon.doe@example.com",
    });
  });
  afterEach(async () => {
    await tryber.tables.WpUsers.do().delete();
  });

  it("Should return 200 if user exist", async () => {
    const response = await request(app).head(
      "/users/by-email/jhon.doe@example.com"
    );
    expect(response.status).toBe(200);
  });
});
