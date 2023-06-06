import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

describe("GET /languages", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqLang.do().insert([
      {
        id: 1,
        display_name: "Language 1",
        lang_code: "l1",
      },
      {
        id: 2,
        display_name: "Language 2",
        lang_code: "l2",
      },
    ]);
  });

  it("should return 403 if not logged in", async () => {
    const response = await request(app).get("/languages");
    expect(response.status).toBe(403);
  });
  it("should return 200 if logged in", async () => {
    const response = await request(app)
      .get("/languages")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("should return a list of languages", async () => {
    const response = await request(app)
      .get("/languages")
      .set("Authorization", "Bearer tester");
    expect(response.body).toEqual([
      {
        id: 1,
        name: "Language 1",
      },
      {
        id: 2,
        name: "Language 2",
      },
    ]);
  });
});
