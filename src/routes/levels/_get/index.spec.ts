import app from "@src/app";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");

describe("GET /levels", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      resolve(null);
    });
  });
  it("Should return 403 if logged out", async () => {
    const response = await request(app).get("/levels");
    expect(response.status).toBe(403);
  });
  it("Should return 200 if logged in", async () => {
    const response = await request(app)
      .get("/levels")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
});
