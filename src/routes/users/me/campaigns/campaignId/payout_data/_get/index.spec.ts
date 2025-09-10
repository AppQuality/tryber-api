import app from "@src/app";
import request from "supertest";
import { tryber } from "@src/features/database";

const campaign = {
  start_date: "2025-09-17",
  platform_id: 1,
  // new date is 5 days in the future
  end_date: "2025-09-29",
  page_version: "v1",
  title: `Campaign`,
  customer_title: `Campaign Customer Title`,
  page_preview_id: 1234,
  page_manual_id: 1234,
  customer_id: 1,
  pm_id: 11111,
  project_id: 1,
  campaign_type_id: 1,
};
describe("GET users/me/campaigns/:cId/payout_data", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqCampaignType.do().insert([
      {
        id: 1,
        name: "Campaign Type 1",
        category_id: 1,
      },
      {
        id: 2,
        name: "Campaign Type 2",
        category_id: 1,
      },
    ]);
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        id: 1,
        wp_user_id: 1,
        name: "John",
        surname: "Doe",
        email: "john.doe@example.com",
        employment_id: 1,
        education_id: 1,
      },
    ]);
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        ...campaign,
        id: 1,
        page_version: "v2",
        is_public: 4,
        campaign_pts: 100,
      }, // 4 = target group
      {
        ...campaign,
        id: 2,
        page_version: "v1",
        is_public: 1,
        campaign_type_id: 2,
        campaign_pts: 200,
      }, // 1 = public
    ]);
    await tryber.tables.CampaignDossierData.do().insert([
      {
        id: 1,
        campaign_id: 1,
        link: "http://example.com/dossier1",
        created_by: 11111,
        updated_by: 11111,
      },
    ]);
    await tryber.tables.CampaignPreviews.do().insert({
      id: 1,
      campaign_id: 1,
      content: "<html>Preview Content</html>",
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
    await tryber.tables.CampaignDossierData.do().delete();
    // reset initial config
  });

  it("Should return 403 if user is not authenticated", async () => {
    const response = await request(app).get(
      "/users/me/campaigns/1/payout_data"
    );
    expect(response.status).toBe(403);
  });
  it("Should return 404 if campaign does not exists", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/100/payout_data")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(404);
  });

  describe("As admin", () => {
    it("Should return 200 if campaign is V2", async () => {
      const response = await request(app)
        .get("/users/me/campaigns/1/payout_data")
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(200);
    });
  });
  describe("As tester NOT in target - targetGroup", () => {
    beforeEach(async () => {
      await tryber.tables.CampaignDossierDataAge.do().insert({
        campaign_dossier_data_id: 1,
        min: 18,
        max: 20,
      });
    });
    afterEach(async () => {
      await tryber.tables.CampaignDossierDataAge.do().delete();
    });
    it("Should return 404 ", async () => {
      const response = await request(app)
        .get("/users/me/campaigns/1/payout_data")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(404);
      expect(response.body).toMatchObject(
        expect.objectContaining({ message: "Campaign not found" })
      );
    });
  });
  describe("As tester in target - targetGroup", () => {
    beforeEach(async () => {
      await tryber.tables.CampaignDossierDataAge.do().insert({
        campaign_dossier_data_id: 1,
        min: 50,
        max: 70,
      });
      await tryber.tables.WpAppqCpMeta.do().insert([
        {
          campaign_id: 1,
          meta_key: "campaign_complete_bonus_eur",
          meta_value: "1.05",
        },
        {
          campaign_id: 1,
          meta_key: "critical_bug_payout",
          meta_value: "2.10",
        },
        {
          campaign_id: 1,
          meta_key: "high_bug_payout",
          meta_value: "3.15",
        },
        {
          campaign_id: 1,
          meta_key: "low_bug_payout",
          meta_value: "4.20",
        },
        {
          campaign_id: 1,
          meta_key: "medium_bug_payout",
          meta_value: "5.25",
        },
      ]);
    });
    afterEach(async () => {
      await tryber.tables.CampaignDossierDataAge.do().delete();
      await tryber.tables.WpAppqCpMeta.do().delete();
    });
    it("Should return 200 ", async () => {
      const response = await request(app)
        .get("/users/me/campaigns/1/payout_data")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
    });
    it("Should return payout data with top_tester_bonus field", async () => {
      const response = await request(app)
        .get("/users/me/campaigns/1/payout_data")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("campaign_pts", 100);
    });
    it("Should return payout data with campaign_complete_bonus_eur field", async () => {
      const response = await request(app)
        .get("/users/me/campaigns/1/payout_data")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("campaign_complete_bonus_eur", 1.05);
    });
    it("Should return payout data with critical_bug_payout field", async () => {
      const response = await request(app)
        .get("/users/me/campaigns/1/payout_data")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("critical_bug_payout", 2.1);
    });
    it("Should return payout data with high_bug_payout field", async () => {
      const response = await request(app)
        .get("/users/me/campaigns/1/payout_data")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("high_bug_payout", 3.15);
    });
    it("Should return payout data with low_bug_payout field", async () => {
      const response = await request(app)
        .get("/users/me/campaigns/1/payout_data")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("low_bug_payout", 4.2);
    });
    it("Should return payout data with medium_bug_payout field", async () => {
      const response = await request(app)
        .get("/users/me/campaigns/1/payout_data")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("medium_bug_payout", 5.25);
    });
  });
});
