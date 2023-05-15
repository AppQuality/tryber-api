import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

beforeAll(async () => {
  await tryber.tables.WpAppqCpMeta.do().insert([
    {
      campaign_id: 1,
      meta_key: "critical_bug_payout",
      meta_value: "0.1",
    },
  ]);
  await tryber.tables.WpAppqEvdProfile.do().insert([
    {
      id: 1,
      wp_user_id: 1,
      name: "John",
      surname: "Doe",
      email: "",
      employment_id: 1,
      education_id: 1,
    },
  ]);
  await tryber.tables.WpUsers.do().insert([{ ID: 1 }]);
  await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
    {
      campaign_id: 1,
      user_id: 1,
      accepted: 1,
    },
  ]);
  await tryber.tables.WpAppqEvdBug.do().insert([
    {
      status_id: 2,
      campaign_id: 1,
      wp_user_id: 1,
      severity_id: 4,
      reviewer: 0,
      last_editor_id: 0,
    },
    {
      status_id: 2,
      campaign_id: 1,
      wp_user_id: 1,
      severity_id: 4,
      reviewer: 0,
      last_editor_id: 0,
    },
    {
      status_id: 2,
      campaign_id: 1,
      wp_user_id: 1,
      severity_id: 4,
      reviewer: 0,
      last_editor_id: 0,
    },
  ]);
  await tryber.tables.WpAppqEvdCampaign.do().insert([
    {
      id: 1,
      platform_id: 1,
      title: "Test Campaign",
      start_date: "2020-01-01",
      end_date: "2020-01-01",
      customer_id: 1,
      page_preview_id: 1,
      page_manual_id: 1,
      pm_id: 1,
      project_id: 1,
      customer_title: "Test Customer",
    },
  ]);
});

describe("GET /campaigns/campaignId/prospect - floating point arithmetic", () => {
  it("Should correctly calculate bonus bug", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toHaveProperty("payout");
    expect(response.body.items[0].payout).toHaveProperty("bug");
    expect(response.body.items[0].payout.bug).toBe(0.3);
  });
});
