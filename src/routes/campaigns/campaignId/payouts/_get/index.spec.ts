import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

beforeAll(async () => {
  await tryber.tables.WpAppqEvdCampaign.do().insert({
    id: 1234,
    platform_id: 1,
    start_date: "2020-01-01",
    end_date: "2020-01-01",
    title: "This is the title",
    page_preview_id: 1,
    page_manual_id: 1,
    pm_id: 1,
    project_id: 1,
    customer_title: "",
    campaign_pts: 150,
  });

  await tryber.tables.WpAppqCpMeta.do().insert({
    campaign_id: 1234,
    meta_key: "payout_limit",
    meta_value: "9.99",
  });

  await tryber.tables.WpAppqCpMeta.do().insert({
    campaign_id: 1234,
    meta_key: "campaign_complete_bonus_eur",
    meta_value: "30",
  });

  await tryber.tables.WpAppqCpMeta.do().insert({
    campaign_id: 1234,
    meta_key: "minimum_bugs",
    meta_value: "3",
  });
  await tryber.tables.WpAppqCpMeta.do().insert({
    campaign_id: 1234,
    meta_key: "percent_usecases",
    meta_value: "65",
  });
});

describe("GET /campaigns/campaignId/payouts", () => {
  it("Should return 403 if logged out", async () => {
    const response = await request(app).get("/campaigns/1234/payouts");
    expect(response.status).toBe(403);
  });

  it("Should return 403 if logged in as not admin user or without olps", async () => {
    const response = await request(app)
      .get("/campaigns/1234/payouts")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 200 if logged in as admin", async () => {
    const response = await request(app)
      .get("/campaigns/1234/payouts")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should return 200 if logged in as tester with both olps tester_selection, prospect", async () => {
    const response = await request(app)
      .get("/campaigns/1234/payouts")
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1234]}'
      );
    expect(response.status).toBe(200);
  });

  it("Should return maxBonusBug", async () => {
    const response = await request(app)
      .get("/campaigns/1234/payouts")
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1234]}'
      );
    expect(response.body).toEqual(
      expect.objectContaining({
        maxBonusBug: 9.99,
      })
    );
  });

  it("Should return payouts and points info", async () => {
    const response = await request(app)
      .get("/campaigns/1234/payouts")
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1234]}'
      );
    expect(response.body).toEqual(
      expect.objectContaining({
        testSuccess: {
          payout: 30,
          points: 150,
          message: "Ottimo lavoro!",
        },
        testFailure: {
          payout: 0,
          points: -300,
          message:
            "Purtroppo non hai completato l’attività, ricevi quindi -300 punti esperienza",
        },
      })
    );
  });

  it("Should return completion rule", async () => {
    const response = await request(app)
      .get("/campaigns/1234/payouts")
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1234]}'
      );
    expect(response.body).toEqual(
      expect.objectContaining({
        completionRule: {
          bugs: 3,
          usecases: 65,
        },
      })
    );
  });
});
