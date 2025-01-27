import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

describe("PUT /campaigns/:campaignId/prospects/:testerId - with old prospect filled", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 1,
      platform_id: 1,
      start_date: new Date().toDateString(),
      end_date: new Date().toDateString(),
      title: "Campaign 1",
      page_preview_id: 1,
      page_manual_id: 1,
      pm_id: 1,
      project_id: 1,
      customer_title: "Customer 1",
    });

    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        id: 1,
        wp_user_id: 1,
        email: "",
        employment_id: 1,
        education_id: 1,
      },
      {
        id: 2,
        wp_user_id: 2,
        email: "",
        employment_id: 1,
        education_id: 1,
      },
    ]);
    await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
      {
        user_id: 1,
        campaign_id: 1,
        accepted: 1,
      },
      {
        user_id: 2,
        campaign_id: 1,
        accepted: 1,
      },
    ]);

    await tryber.tables.WpAppqProspectPayout.do().insert({
      id: 1,
      tester_id: 2,
      complete_pts: 0,
      extra_pts: 0,
      complete_eur: 0,
      extra_eur: 0,
      refund: 0,
      bonus_bug_eur: 0,
      is_edit: 4,
      campaign_id: 1,
    });
  });
  afterEach(async () => {
    await tryber.tables.WpAppqProspectPayout.do().delete();
  });

  it("should answer 412 if there is an edit from old prospect", async () => {
    const response = await request(app)
      .put("/campaigns/1/prospect/1")
      .send({
        payout: {
          completion: 0,
          bugs: 0,
          refund: 0,
          extra: 0,
        },
        experience: {
          completion: 0,
          extra: 0,
        },
        note: "string",
        completed: true,
      })
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":true}');
    expect(response.status).toBe(412);
  });
});
