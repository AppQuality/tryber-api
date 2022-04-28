import app from "@src/app";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");

describe("GET /users/me/rank/list", () => {
  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/users/me/rank/list");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged in", async () => {
    const response = await request(app)
      .get("/users/me/rank/list")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should have 3 items as tops", async () => {
    const response = await request(app)
      .get("/users/me/rank/list")
      .set("authorization", "Bearer tester");
    expect(response.body).toHaveProperty("tops");
    expect(response.body.tops.length).toBe(3);
  });
});
