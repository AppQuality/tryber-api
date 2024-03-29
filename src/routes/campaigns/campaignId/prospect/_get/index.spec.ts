import request from "supertest";
import app from "@src/app";
import useCampaign from "./useCampaign";
import { tryber } from "@src/features/database";

useCampaign();
describe("GET /campaigns/campaignId/prospect", () => {
  it("Should return 403 if logged out", async () => {
    const response = await request(app).get("/campaigns/1/prospect");
    expect(response.status).toBe(403);
  });

  it("Should return 403 if logged in as not admin user", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 400 if campaign does not exists", async () => {
    const response = await request(app)
      .get("/campaigns/100/prospect")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(400);
  });

  it("Should return 200 if logged in as admin", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should return 200 if logged in as tester with both olp tester_selection", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.status).toBe(200);
  });

  it("Should return an item for each selected tester", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toHaveLength(1);
  });
});

describe("GET /campaigns/campaignId/prospect - tester payouts were edit", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqProspectPayout.do().insert({
      id: 1,
      campaign_id: 1,
      tester_id: 1,
      complete_pts: 100,
      extra_pts: 69,
      complete_eur: 25,
      bonus_bug_eur: 5,
      extra_eur: 9,
      refund: 1,
      notes: "This is the notes",
      is_edit: 0,
    });
  });

  afterAll(async () => {
    await tryber.tables.WpAppqProspectPayout.do().delete();
  });

  it("Should return 200 ", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.status).toBe(200);
  });
});

describe("GET /campaigns/campaignId/prospect - there are no testers in Campaign", () => {
  beforeAll(async () => {
    await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
  });

  it("Should return 404 when there are no selected testers in Campaign", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.status).toBe(404);
  });
});
