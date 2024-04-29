import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("GET /productTypes", () => {
  beforeAll(async () => {
    await tryber.tables.ProductTypes.do().insert([
      {
        id: 1,
        name: "Type 1",
      },
      {
        id: 2,
        name: "Type 2",
      },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.Browsers.do().delete();
  });

  it("should return all productTypes", async () => {
    const response = await request(app).get("/productTypes");
    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toHaveLength(2);
    expect(response.body.results).toEqual([
      {
        id: 1,
        name: "Type 1",
      },
      {
        id: 2,
        name: "Type 2",
      },
    ]);
  });
});
