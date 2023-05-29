import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

describe("GET /employments", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEmployment.do().insert([
      {
        id: 1,
        display_name: "Employments 1",
        category: "Student",
      },
      {
        id: 2,
        display_name: "Employments 2",
        category: "Information Technology",
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEmployment.do().delete();
  });

  it("should return 403 if not logged in", async () => {
    const response = await request(app).get("/employments");
    expect(response.status).toBe(403);
  });
  it("should return 200 if logged in", async () => {
    const response = await request(app)
      .get("/employments")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("should return a list of employments", async () => {
    const response = await request(app)
      .get("/employments")
      .set("Authorization", "Bearer tester");
    expect(response.body).toEqual([
      {
        id: 1,
        name: "Employments 1",
      },
      {
        id: 2,
        name: "Employments 2",
      },
    ]);
  });
});

describe("GET /employments when there are no employment", () => {
  it("should return 404 if the are no employment", async () => {
    const response = await request(app)
      .get("/employments")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(404);
  });
});
