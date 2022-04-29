import {
  data as profileData,
  table as profileTable,
} from "@src/__mocks__/mockedDb/profile";
import app from "@src/app";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");

describe("Route GET users-me-rank", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      profileTable.create();
      profileData.testerWithBooty();
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      profileTable.drop();
      resolve(null);
    });
  });

  it("Should return 403 if does not logged in", async () => {
    const response = await request(app).get("/users/me/rank");
    expect(response.status).toBe(403);
  });
  it("Should return 200 if logged in", async () => {
    const response = await request(app)
      .get("/users/me/rank")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
});
