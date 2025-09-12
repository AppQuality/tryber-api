import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("GET /campaigns/campaignId/payouts", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().insert({
      id: 1,
      wp_user_id: 1,
      email: "user@example.com",
      employment_id: 1,
      education_id: 1,
    });
    await tryber.tables.WpAppqProject.do().insert({
      display_name: "Test Project",
      id: 15,
      customer_id: 15,
      edited_by: 1,
    });
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 1,
      platform_id: 1,
      start_date: "2020-01-01",
      end_date: "2020-01-01",
      title: "This is the title",
      page_preview_id: 1,
      page_manual_id: 1,
      customer_id: 1,
      pm_id: 1,
      project_id: 1,
      customer_title: "",
      campaign_pts: 200,
      campaign_type_id: 1,
    });
    await tryber.tables.WpAppqCampaignType.do().insert({
      id: 1,
      name: "functional",
      description: "functional description",
      category_id: 1,
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.WpAppqProject.do().delete();
  });
  describe("Permissions checking", () => {
    describe("Not enough permissions", () => {
      it("Should return 403 if logged out", async () => {
        const response = await request(app)
          .put("/campaigns/1/payouts")
          .send({});
        expect(response.status).toBe(403);
      });

      it("Should return 403 if logged in as user without olps", async () => {
        const response = await request(app)
          .put("/campaigns/1/payouts")
          .set("Authorization", "Bearer user")
          .send({
            campaign_complete_bonus_eur: 10,
            campaign_pts: 200,
            critical_bug_payout: 4,
            high_bug_payout: 3,
            low_bug_payout: 1,
            medium_bug_payout: 2,
            minimum_bugs: 1,
            payout_limit: 10,
            percent_usecases: 50,
            point_multiplier_critical: 4,
            point_multiplier_high: 3,
            point_multiplier_low: 1,
            point_multiplier_medium: 2,
            point_multiplier_perfect: 2,
            point_multiplier_refused: 2,
            top_tester_bonus: 10,
          });
        expect(response.status).toBe(403);
      });
    });

    describe("Enough permissions", () => {
      it("Should return 200 if logged in as admin", async () => {
        const response = await request(app)
          .put("/campaigns/1/payouts")
          .set("Authorization", "Bearer admin")
          .send({
            campaign_complete_bonus_eur: 10,
          });
        expect(response.status).toBe(200);
      });

      it("Should return 200 if logged in as user with olps", async () => {
        const response = await request(app)
          .put("/campaigns/1/payouts")
          .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}')
          .send({
            campaign_complete_bonus_eur: 10,
            campaign_pts: 200,
            critical_bug_payout: 4,
            high_bug_payout: 3,
            low_bug_payout: 1,
          });
        expect(response.status).toBe(200);
      });

      describe("Invalid body", () => {
        it("Should return 403 if the body is empty", async () => {
          const response = await request(app)
            .put("/campaigns/1/payouts")
            .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}')
            .send({});

          expect(response.status).toBe(403);
        });

        it("Should return 403 if the body contains wrong keys", async () => {
          const response = await request(app)
            .put("/campaigns/1/payouts")
            .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}')
            .send({
              wrong_key: 10,
            });
          expect(response.status).toBe(403);
        });

        it("Should return 400 if the body contains negative values", async () => {
          const response = await request(app)
            .put("/campaigns/1/payouts")
            .set("Authorization", "Bearer admin")
            .send({
              campaign_complete_bonus_eur: -10,
              point_multiplier_high: -3,
            });
          console.log(response.body);
          expect(response.status).toBe(400);
        });

        it("Should return 400 if the body contains values that are not numbers", async () => {
          const response = await request(app)
            .put("/campaigns/1/payouts")
            .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}')
            .send({
              campaign_complete_bonus_eur: "ten",
              point_multiplier_high: "three",
            });
          expect(response.status).toBe(400);
        });

        it("Should return 400 if trying to pass a percentage over 100", async () => {
          const response = await request(app)
            .put("/campaigns/1/payouts")
            .set("Authorization", "Bearer admin")
            .send({
              percent_usecases: 150,
            });
          expect(response.status).toBe(400);
        });
      });

      describe("Valid body - Checking payout data update in cp_meta", () => {
        it("Should update the campaign_complete_bonus_eur", async () => {
          const response = await request(app)
            .put("/campaigns/1/payouts")
            .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}')
            .send({
              campaign_complete_bonus_eur: 10,
            });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty("campaign_complete_bonus_eur");
          expect(response.body.campaign_complete_bonus_eur).toBe(10);

          const cpMeta = await tryber.tables.WpAppqCpMeta.do()
            .select("*")
            .where({ campaign_id: 1 })
            .first();
          expect(cpMeta).toBeDefined();
          expect(cpMeta?.meta_key).toBe("campaign_complete_bonus_eur");
          expect(cpMeta?.meta_value).toBe("10");
        });
        it("Should update the campaign_pts", async () => {
          const response = await request(app)
            .put("/campaigns/1/payouts")
            .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}')
            .send({
              campaign_pts: 399,
            });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty("campaign_pts");
          expect(response.body.campaign_pts).toBe(399);

          const pts = await tryber.tables.WpAppqEvdCampaign.do()
            .select("campaign_pts")
            .where({ id: 1 })
            .first();
          expect(pts).toBeDefined();
          expect(pts?.campaign_pts).toBe(399);
        });

        it("Should update critical_bug_payout", async () => {
          const response = await request(app)
            .put("/campaigns/1/payouts")
            .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}')
            .send({
              critical_bug_payout: 7,
            });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty("critical_bug_payout");
          expect(response.body.critical_bug_payout).toBe(7);

          const cpMeta = await tryber.tables.WpAppqCpMeta.do()
            .select("*")
            .where({ campaign_id: 1, meta_key: "critical_bug_payout" })
            .first();
          expect(cpMeta).toBeDefined();
          expect(cpMeta?.meta_key).toBe("critical_bug_payout");
          expect(cpMeta?.meta_value).toBe("7");
        });

        it("Should update high_bug_payout", async () => {
          const response = await request(app)
            .put("/campaigns/1/payouts")
            .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}')
            .send({
              high_bug_payout: 6,
            });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty("high_bug_payout");
          expect(response.body.high_bug_payout).toBe(6);

          const cpMeta = await tryber.tables.WpAppqCpMeta.do()
            .select("*")
            .where({ campaign_id: 1, meta_key: "high_bug_payout" })
            .first();
          expect(cpMeta).toBeDefined();
          expect(cpMeta?.meta_key).toBe("high_bug_payout");
          expect(cpMeta?.meta_value).toBe("6");
        });

        it("Should update low_bug_payout", async () => {
          const response = await request(app)
            .put("/campaigns/1/payouts")
            .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}')
            .send({
              low_bug_payout: 5,
            });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty("low_bug_payout");
          expect(response.body.low_bug_payout).toBe(5);

          const cpMeta = await tryber.tables.WpAppqCpMeta.do()
            .select("*")
            .where({ campaign_id: 1, meta_key: "low_bug_payout" })
            .first();
          expect(cpMeta).toBeDefined();
          expect(cpMeta?.meta_key).toBe("low_bug_payout");
          expect(cpMeta?.meta_value).toBe("5");
        });

        it("Should update medium_bug_payout", async () => {
          const response = await request(app)
            .put("/campaigns/1/payouts")
            .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}')
            .send({
              medium_bug_payout: 4,
            });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty("medium_bug_payout");
          expect(response.body.medium_bug_payout).toBe(4);

          const cpMeta = await tryber.tables.WpAppqCpMeta.do()
            .select("*")
            .where({ campaign_id: 1, meta_key: "medium_bug_payout" })
            .first();
          expect(cpMeta).toBeDefined();
          expect(cpMeta?.meta_key).toBe("medium_bug_payout");
          expect(cpMeta?.meta_value).toBe("4");
        });

        it("Should update payout_limit", async () => {
          const response = await request(app)
            .put("/campaigns/1/payouts")
            .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}')
            .send({
              payout_limit: 300,
            });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty("payout_limit");
          expect(response.body.payout_limit).toBe(300);

          const cpMeta = await tryber.tables.WpAppqCpMeta.do()
            .select("*")
            .where({ campaign_id: 1, meta_key: "payout_limit" })
            .first();
          expect(cpMeta).toBeDefined();
          expect(cpMeta?.meta_key).toBe("payout_limit");
          expect(cpMeta?.meta_value).toBe("300");
        });

        it("Should update percent_usecases", async () => {
          const response = await request(app)
            .put("/campaigns/1/payouts")
            .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}')
            .send({ percent_usecases: 55 });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty("percent_usecases");
          expect(response.body.percent_usecases).toBe(55);

          const cpMeta = await tryber.tables.WpAppqCpMeta.do()
            .select("*")
            .where({ campaign_id: 1, meta_key: "percent_usecases" })
            .first();
          expect(cpMeta).toBeDefined();
          expect(cpMeta?.meta_key).toBe("percent_usecases");
          expect(cpMeta?.meta_value).toBe("55");
        });

        it("Should update point_multiplier_critical", async () => {
          const response = await request(app)
            .put("/campaigns/1/payouts")
            .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}')
            .send({ point_multiplier_critical: 2 });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty("point_multiplier_critical");
          expect(response.body.point_multiplier_critical).toBe(2);

          const cpMeta = await tryber.tables.WpAppqCpMeta.do()
            .select("*")
            .where({ campaign_id: 1, meta_key: "point_multiplier_critical" })
            .first();
          expect(cpMeta).toBeDefined();
          expect(cpMeta?.meta_key).toBe("point_multiplier_critical");
          expect(cpMeta?.meta_value).toBe("2");
        });

        it("Should update point_multiplier_high", async () => {
          const response = await request(app)
            .put("/campaigns/1/payouts")
            .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}')
            .send({ point_multiplier_high: 3 });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty("point_multiplier_high");
          expect(response.body.point_multiplier_high).toBe(3);

          const cpMeta = await tryber.tables.WpAppqCpMeta.do()
            .select("*")
            .where({ campaign_id: 1, meta_key: "point_multiplier_high" })
            .first();
          expect(cpMeta).toBeDefined();
          expect(cpMeta?.meta_key).toBe("point_multiplier_high");
          expect(cpMeta?.meta_value).toBe("3");
        });

        it("Should update point_multiplier_low", async () => {
          const response = await request(app)
            .put("/campaigns/1/payouts")
            .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}')
            .send({ point_multiplier_low: 1 });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty("point_multiplier_low");
          expect(response.body.point_multiplier_low).toBe(1);

          const cpMeta = await tryber.tables.WpAppqCpMeta.do()
            .select("*")
            .where({ campaign_id: 1, meta_key: "point_multiplier_low" })
            .first();
          expect(cpMeta).toBeDefined();
          expect(cpMeta?.meta_key).toBe("point_multiplier_low");
          expect(cpMeta?.meta_value).toBe("1");
        });

        it("Should update point_multiplier_medium", async () => {
          const response = await request(app)
            .put("/campaigns/1/payouts")
            .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}')
            .send({ point_multiplier_medium: 2 });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty("point_multiplier_medium");
          expect(response.body.point_multiplier_medium).toBe(2);

          const cpMeta = await tryber.tables.WpAppqCpMeta.do()
            .select("*")
            .where({ campaign_id: 1, meta_key: "point_multiplier_medium" })
            .first();
          expect(cpMeta).toBeDefined();
          expect(cpMeta?.meta_key).toBe("point_multiplier_medium");
          expect(cpMeta?.meta_value).toBe("2");
        });

        it("Should update point_multiplier_perfect", async () => {
          const response = await request(app)
            .put("/campaigns/1/payouts")
            .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}')
            .send({ point_multiplier_perfect: 5 });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty("point_multiplier_perfect");
          expect(response.body.point_multiplier_perfect).toBe(5);

          const cpMeta = await tryber.tables.WpAppqCpMeta.do()
            .select("*")
            .where({ campaign_id: 1, meta_key: "point_multiplier_perfect" })
            .first();
          expect(cpMeta).toBeDefined();
          expect(cpMeta?.meta_key).toBe("point_multiplier_perfect");
          expect(cpMeta?.meta_value).toBe("5");
        });

        it("Should update point_multiplier_refused", async () => {
          const response = await request(app)
            .put("/campaigns/1/payouts")
            .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}')
            .send({ point_multiplier_refused: 0 });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty("point_multiplier_refused");
          expect(response.body.point_multiplier_refused).toBe(0);

          const cpMeta = await tryber.tables.WpAppqCpMeta.do()
            .select("*")
            .where({ campaign_id: 1, meta_key: "point_multiplier_refused" })
            .first();
          expect(cpMeta).toBeDefined();
          expect(cpMeta?.meta_key).toBe("point_multiplier_refused");
          expect(cpMeta?.meta_value).toBe("0");
        });

        it("Should update top_tester_bonus", async () => {
          const response = await request(app)
            .put("/campaigns/1/payouts")
            .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}')
            .send({ top_tester_bonus: 99 });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty("top_tester_bonus");
          expect(response.body.top_tester_bonus).toBe(99);

          const cpMeta = await tryber.tables.WpAppqCpMeta.do()
            .select("*")
            .where({ campaign_id: 1, meta_key: "top_tester_bonus" })
            .first();
          expect(cpMeta).toBeDefined();
          expect(cpMeta?.meta_key).toBe("top_tester_bonus");
          expect(cpMeta?.meta_value).toBe("99");
        });

        it("Should update multiple fields at once", async () => {
          const response = await request(app)
            .put("/campaigns/1/payouts")
            .set("Authorization", "Bearer admin")
            .send({
              campaign_complete_bonus_eur: 20,
              campaign_pts: 500,
              critical_bug_payout: 8,
              high_bug_payout: 7,
              low_bug_payout: 6,
              medium_bug_payout: 5,
              payout_limit: 400,
              percent_usecases: 60,
              point_multiplier_critical: 3,
              point_multiplier_high: 4,
              point_multiplier_low: 2,
              point_multiplier_medium: 3,
              point_multiplier_perfect: 6,
              point_multiplier_refused: 1,
              top_tester_bonus: 199,
            });

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty("campaign_complete_bonus_eur");
          expect(response.body).toHaveProperty("campaign_pts");
          expect(response.body).toHaveProperty("critical_bug_payout");
          expect(response.body).toHaveProperty("high_bug_payout");
          expect(response.body).toHaveProperty("low_bug_payout");
          expect(response.body).toHaveProperty("medium_bug_payout");
          expect(response.body).toHaveProperty("payout_limit");
          expect(response.body).toHaveProperty("percent_usecases");
          expect(response.body).toHaveProperty("point_multiplier_critical");
          expect(response.body).toHaveProperty("point_multiplier_high");
          expect(response.body).toHaveProperty("point_multiplier_low");
          expect(response.body).toHaveProperty("point_multiplier_medium");
          expect(response.body).toHaveProperty("point_multiplier_perfect");
          expect(response.body).toHaveProperty("point_multiplier_refused");
          expect(response.body).toHaveProperty("top_tester_bonus");
          expect(response.body.campaign_complete_bonus_eur).toBe(20);
          expect(response.body.campaign_pts).toBe(500);
          expect(response.body.critical_bug_payout).toBe(8);
          expect(response.body.high_bug_payout).toBe(7);
          expect(response.body.low_bug_payout).toBe(6);
          expect(response.body.medium_bug_payout).toBe(5);
          expect(response.body.payout_limit).toBe(400);
          expect(response.body.percent_usecases).toBe(60);
          expect(response.body.point_multiplier_critical).toBe(3);
          expect(response.body.point_multiplier_high).toBe(4);
          expect(response.body.point_multiplier_low).toBe(2);
          expect(response.body.point_multiplier_medium).toBe(3);
          expect(response.body.point_multiplier_perfect).toBe(6);
          expect(response.body.point_multiplier_refused).toBe(1);
          expect(response.body.top_tester_bonus).toBe(199);

          const cpMeta = await tryber.tables.WpAppqCpMeta.do()
            .select("*")
            .where({ campaign_id: 1 });
          expect(cpMeta.length).toBeGreaterThanOrEqual(14);
          const cpMetaMap: { [key: string]: string } = {};
          cpMeta.forEach((meta) => {
            cpMetaMap[meta.meta_key] = meta.meta_value;
          });

          expect(cpMetaMap["campaign_complete_bonus_eur"]).toBe("20");
          expect(cpMetaMap["critical_bug_payout"]).toBe("8");
          expect(cpMetaMap["high_bug_payout"]).toBe("7");
          expect(cpMetaMap["low_bug_payout"]).toBe("6");
          expect(cpMetaMap["medium_bug_payout"]).toBe("5");
          expect(cpMetaMap["payout_limit"]).toBe("400");
          expect(cpMetaMap["percent_usecases"]).toBe("60");
          expect(cpMetaMap["point_multiplier_critical"]).toBe("3");
          expect(cpMetaMap["point_multiplier_high"]).toBe("4");
          expect(cpMetaMap["point_multiplier_low"]).toBe("2");
          expect(cpMetaMap["point_multiplier_medium"]).toBe("3");
          expect(cpMetaMap["point_multiplier_perfect"]).toBe("6");
          expect(cpMetaMap["point_multiplier_refused"]).toBe("1");
          expect(cpMetaMap["top_tester_bonus"]).toBe("199");

          const pts = await tryber.tables.WpAppqEvdCampaign.do()
            .select("campaign_pts")
            .where({ id: 1 })
            .first();
          expect(pts).toBeDefined();
          expect(pts?.campaign_pts).toBe(500);
        });
      });
    });
  });
});
