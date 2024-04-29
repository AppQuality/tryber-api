import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("GET /browsers", () => {
  beforeAll(async () => {
    await tryber.tables.Browsers.do().insert([
      {
        id: 1,
        name: "Browser 1",
      },
      {
        id: 2,
        name: "Browser 2",
      },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.Browsers.do().delete();
  });

  it("should return all browsers", async () => {
    const response = await request(app).get("/browsers");
    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toHaveLength(2);
    expect(response.body.results).toEqual([
      {
        id: 1,
        name: "Browser 1",
      },
      {
        id: 2,
        name: "Browser 2",
      },
    ]);
  });
});
