import {
  data as levelDefData,
  table as levelDefTable,
} from "@src/__mocks__/mockedDb/levelsDefinition";
import app from "@src/app";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");

describe("GET /levels", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      await levelDefTable.create();
      await levelDefData.basicLevel();
      await levelDefData.basicLevel({ id: 20, name: "Bronze" });
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      await levelDefTable.drop();
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
  it("Should return levels", async () => {
    const response = await request(app)
      .get("/levels")
      .set("authorization", "Bearer tester");
    console.log(response.body);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toEqual({
      id: 10,
      name: "Basic",
      reach: 0,
      hold: 0,
    });
  });
});
