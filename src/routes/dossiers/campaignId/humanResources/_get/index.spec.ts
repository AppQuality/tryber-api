import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("Route GET /dossiers/:campaignId/humanResources", () => {
  beforeAll(async () => {
    const campaign = {
      title: "Test Campaign",
      customer_title: "Test Campaign",
      start_date: "2023-01-01",
      end_date: "2023-12-31",
      pm_id: 1,
      platform_id: 1,
      page_preview_id: 1,
      page_manual_id: 1,
      customer_id: 1,
      project_id: 1,
    };
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 1 },
      { ...campaign, id: 2 },
    ]);
    const tester = {
      education_id: 1,
      email: "",
      employment_id: 1,
    };
    await tryber.tables.WpAppqEvdProfile.do().insert([
      { ...tester, id: 1, wp_user_id: 10, name: "Tester One" },
      { ...tester, id: 2, wp_user_id: 20, name: "Tester Two" },
    ]);
    await tryber.tables.WorkRates.do().insert([
      { id: 1, name: "Researcher", daily_rate: 1.5 },
      { id: 2, name: "PM", daily_rate: 2.0 },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WorkRates.do().delete();
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/dossiers/1/humanResources");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if admin", async () => {
    const response = await request(app)
      .get("/dossiers/1/humanResources")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });
  it("Should answer 400 if tester", async () => {
    const response = await request(app)
      .get("/dossiers/1/humanResources")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if has access to campaign", async () => {
    const response = await request(app)
      .get("/dossiers/1/humanResources")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(200);
  });

  describe("With basic data", () => {
    beforeAll(async () => {
      await tryber.tables.CampaignHumanResources.do().insert([
        {
          id: 1,
          campaign_id: 1,
          profile_id: 1,
          days: 10,
          work_rate_id: 1,
        },
        {
          id: 2,
          campaign_id: 1,
          profile_id: 2,
          days: 4.5,
          work_rate_id: 2,
        },
        {
          id: 3,
          campaign_id: 2,
          profile_id: 1,
          days: 4.5,
          work_rate_id: 2,
        },
      ]);
    });
    afterAll(async () => {
      await tryber.tables.CampaignHumanResources.do().delete();
    });

    it("Should return human resources for campaign 1", async () => {
      const response = await request(app)
        .get("/dossiers/1/humanResources")
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        items: [
          {
            id: 1,
            assignee: {
              id: 1,
            },
            days: 10,
            rate: {
              id: 1,
              value: 1.5,
            },
          },
          {
            id: 2,
            assignee: {
              id: 2,
            },
            days: 4.5,
            rate: {
              id: 2,
              value: 2,
            },
          },
        ],
      });
    });
  });
});
