import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

describe("GET /education", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEducation.do().insert([
      {
        id: 1,
        display_name: "Education 1",
      },
      {
        id: 2,
        display_name: "Education 2",
      },
    ]);
  });

  it("should return 403 if not logged in", async () => {
    const response = await request(app).get("/education");
    expect(response.status).toBe(403);
  });
  it("should return 200 if logged in", async () => {
    const response = await request(app)
      .get("/education")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("should return a list of education", async () => {
    const response = await request(app)
      .get("/education")
      .set("Authorization", "Bearer tester");
    expect(response.body).toEqual([
      {
        id: 1,
        name: "Education 1",
      },
      {
        id: 2,
        name: "Education 2",
      },
    ]);
  });
});
