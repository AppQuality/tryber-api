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
      }, // 4 = target group
    ]);
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        ...campaign,
        id: 2,
        page_version: "v1",
        is_public: 1,
        campaign_type_id: 2,
        campaign_pts: 2050,
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
    });
    afterEach(async () => {
      await tryber.tables.CampaignDossierDataAge.do().delete();
    });

    describe("payout data not present", () => {
      beforeEach(async () => {
        await tryber.tables.WpAppqCpMeta.do().delete();
      });
      it("Should return 200", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/payout_data")
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(200);
      });
      it("Should return payout data with all fields set to 0", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/payout_data")
          .set("Authorization", "Bearer tester");
        expect(response.body).toMatchObject({
          campaign_complete_bonus_eur: 0,
          critical_bug_payout: 0,
          high_bug_payout: 0,
          low_bug_payout: 0,
          medium_bug_payout: 0,
          minimum_bugs: 0,
          payout_limit: 0,
          percent_usecases: 0,
          point_multiplier_critical: 0,
          point_multiplier_high: 0,
          point_multiplier_low: 0,
          point_multiplier_medium: 0,
          point_multiplier_perfect: 0,
          point_multiplier_refused: 0,
          top_tester_bonus: 0,
        });
      });
      it("Should return payout data with campaign_pts field set to 200 as default", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/payout_data")
          .set("Authorization", "Bearer tester");
        expect(response.body).toHaveProperty("campaign_pts", 200);
      });
    });
    describe("payout data present", () => {
      beforeEach(async () => {
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
          {
            campaign_id: 1,
            meta_key: "minimum_bugs",
            meta_value: "6",
          },
          {
            campaign_id: 1,
            meta_key: "payout_limit",
            meta_value: "7.30",
          },
          {
            campaign_id: 1,
            meta_key: "percent_usecases",
            meta_value: "8.35",
          },
          {
            campaign_id: 1,
            meta_key: "point_multiplier_critical",
            meta_value: "9.40",
          },
          {
            campaign_id: 1,
            meta_key: "point_multiplier_high",
            meta_value: "10.45",
          },
          {
            campaign_id: 1,
            meta_key: "point_multiplier_low",
            meta_value: "11.50",
          },
          {
            campaign_id: 1,
            meta_key: "point_multiplier_medium",
            meta_value: "12.55",
          },
          {
            campaign_id: 1,
            meta_key: "point_multiplier_perfect",
            meta_value: "13.60",
          },
          {
            campaign_id: 1,
            meta_key: "point_multiplier_refused",
            meta_value: "14.65",
          },
          {
            campaign_id: 1,
            meta_key: "top_tester_bonus",
            meta_value: "999.99",
          },
        ]);
      });
      afterEach(async () => {
        await tryber.tables.WpAppqCpMeta.do().delete();
      });

      it("Should return 200", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/payout_data")
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(200);
      });
      it("Should return payout data with top_tester_bonus field 200 as default", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/payout_data")
          .set("Authorization", "Bearer tester");
        expect(response.body).toHaveProperty("campaign_pts", 200);
      });
      it("Should return payout data with campaign_complete_bonus_eur field", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/payout_data")
          .set("Authorization", "Bearer tester");
        expect(response.body).toHaveProperty(
          "campaign_complete_bonus_eur",
          1.05
        );
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
      it("Should return payout data with minimum_bugs field", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/payout_data")
          .set("Authorization", "Bearer tester");
        expect(response.body).toHaveProperty("minimum_bugs", 6);
      });
      it("Should return payout data with payout_limit field", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/payout_data")
          .set("Authorization", "Bearer tester");
        expect(response.body).toHaveProperty("payout_limit", 7.3);
      });
      it("Should return payout data with percent_usecases field", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/payout_data")
          .set("Authorization", "Bearer tester");
        expect(response.body).toHaveProperty("percent_usecases", 8.35);
      });
      it("Should return payout data with point_multiplier_critical field", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/payout_data")
          .set("Authorization", "Bearer tester");
        expect(response.body).toHaveProperty("point_multiplier_critical", 9.4);
      });
      it("Should return payout data with point_multiplier_high field", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/payout_data")
          .set("Authorization", "Bearer tester");
        expect(response.body).toHaveProperty("point_multiplier_high", 10.45);
      });
      it("Should return payout data with point_multiplier_low field", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/payout_data")
          .set("Authorization", "Bearer tester");
        expect(response.body).toHaveProperty("point_multiplier_low", 11.5);
      });
      it("Should return payout data with point_multiplier_medium field", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/payout_data")
          .set("Authorization", "Bearer tester");
        expect(response.body).toHaveProperty("point_multiplier_medium", 12.55);
      });
      it("Should return payout data with point_multiplier_perfect field", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/payout_data")
          .set("Authorization", "Bearer tester");
        expect(response.body).toHaveProperty("point_multiplier_perfect", 13.6);
      });
      it("Should return payout data with point_multiplier_refused field", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/payout_data")
          .set("Authorization", "Bearer tester");
        expect(response.body).toHaveProperty("point_multiplier_refused", 14.65);
      });
      it("Should return payout data with top_tester_bonus field", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/payout_data")
          .set("Authorization", "Bearer tester");
        expect(response.body).toHaveProperty("top_tester_bonus", 999.99);
      });
    });
  });
});
