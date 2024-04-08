import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("GET projects", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqProject.do().insert({
      id: 1,
      display_name: "project 1",
      customer_id: 1,
      edited_by: 1,
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqProject.do().delete();
  });
  it("Should return 403 if not logged request", async () => {
    const response = await request(app).get("/projects");
    expect(response.status).toBe(403);
  });
  it("Should return 200 if logged as admin", async () => {
    const response = await request(app)
      .get("/projects")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });
  it("Should return 403 if logged as tester", async () => {
    const response = await request(app)
      .get("/projects")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should return projects if logged as admin and project exists", async () => {
    const response = await request(app)
      .get("/projects")
      .set("Authorization", "Bearer admin");
    expect(response.body).toEqual({
      results: [
        {
          id: 1,
          name: "project 1",
        },
      ],
    });
  });
  // todo: pagination
});
