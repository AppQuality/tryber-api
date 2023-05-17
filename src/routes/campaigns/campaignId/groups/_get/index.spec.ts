import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("GET /campaigns/campaignId/groups", () => {
  beforeAll(async () => {
    await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
      {
        campaign_id: 1,
        user_id: 1,
        group_id: 1,
      },
      {
        campaign_id: 1,
        user_id: 2,
        group_id: 1,
      },
      {
        campaign_id: 1,
        user_id: 3,
        group_id: 2,
      },
    ]);
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 1,
      platform_id: 1,
      start_date: "2023-01-01 00:00:00",
      end_date: "2023-01-01 00:00:00",
      title: "Test Campaign",
      page_preview_id: 1,
      page_manual_id: 1,
      customer_id: 1,
      pm_id: 1,
      project_id: 1,
      customer_title: "Test Customer",
    });
  });
  afterAll(async () => {
    await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
  });

  it("Should return 403 if logged out", async () => {
    const response = await request(app).get("/campaigns/1/groups");
    expect(response.status).toBe(403);
  });

  it("Should return 403 if logged in as tester", async () => {
    const response = await request(app)
      .get("/campaigns/1/groups")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 200 if logged in as tester with campaign access", async () => {
    const response = await request(app)
      .get("/campaigns/1/groups")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(200);
  });

  it("Should return 200 if logged in as tester with tester selection access", async () => {
    const response = await request(app)
      .get("/campaigns/1/groups")
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.status).toBe(200);
  });

  it("Should return 200 if logged in as admin", async () => {
    const response = await request(app)
      .get("/campaigns/1/groups")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should return a list of groups", async () => {
    const response = await request(app)
      .get("/campaigns/1/groups")
      .set("Authorization", "Bearer admin");
    expect(response.body).toEqual([
      { id: 1, name: "Group 1" },
      { id: 2, name: "Group 2" },
    ]);
  });
});
