import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("Route GET /phases", () => {
  beforeAll(async () => {
    await tryber.tables.CampaignPhase.do().insert([
      { id: 1, name: "Phase 1", type_id: 1 },
      { id: 2, name: "Phase 2", type_id: 2 },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.CampaignPhase.do().delete();
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/phases");
    expect(response.status).toBe(403);
  });

  it("Should answer 200 if logged in as admin", async () => {
    const response = await request(app)
      .get("/phases")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should answer 403 if logged in as user", async () => {
    const response = await request(app)
      .get("/phases")
      .set("authorization", "Bearer tester");

    expect(response.status).toBe(403);
  });

  it("Should answer 200 if logged in with full access", async () => {
    const response = await request(app)
      .get("/phases")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
  });

  it("Should answer 200 if logged in at least one campaign", async () => {
    const response = await request(app)
      .get("/phases")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(200);
  });

  it("should return all phases", async () => {
    const response = await request(app)
      .get("/phases")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toHaveLength(2);
    expect(response.body.results).toEqual([
      { id: 1, name: "Phase 1" },
      { id: 2, name: "Phase 2" },
    ]);
  });
});
