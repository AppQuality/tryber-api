import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

describe("PUT /campaigns/:campaignId/prospects/:testerId - with a propect database item", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 1,
      platform_id: 1,
      start_date: new Date().toDateString(),
      end_date: new Date().toDateString(),
      title: "Campaign 1",
      page_preview_id: 1,
      page_manual_id: 1,
      customer_id: 1,
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
    ]);
    await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
      {
        user_id: 1,
        campaign_id: 1,
        accepted: 1,
      },
    ]);
  });
  beforeEach(async () => {
    await tryber.tables.WpAppqProspectPayout.do().insert({
      campaign_id: 1,
      tester_id: 1,
      is_edit: 0,
      complete_pts: 1000,
      extra_pts: 1000,
      complete_eur: 1000,
      extra_eur: 1000,
      refund: 1000,
      bonus_bug_eur: 1000,
      notes: "Old note",
      is_completed: 0,
    });
  });
  afterEach(async () => {
    await tryber.tables.WpAppqProspectPayout.do().delete();
  });

  it("should answer 200", async () => {
    const response = await request(app)
      .put("/campaigns/1/prospect/1")
      .send({
        payout: {
          completion: 10.5,
          bugs: 7.5,
          refund: 5,
          extra: 5,
        },
        experience: {
          completion: 100,
          extra: 3,
        },
        note: "Note",
        completed: true,
      })
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":true,"appq_prospect":true}'
      );
    expect(response.status).toBe(200);
  });

  it("should replace a prospect row", async () => {
    const prospectBeforeInsert = await tryber.tables.WpAppqProspectPayout.do()
      .select()
      .where("campaign_id", 1);
    expect(prospectBeforeInsert.length).toBe(1);
    const response = await request(app)
      .put("/campaigns/1/prospect/1")
      .send({
        payout: {
          completion: 10.5,
          bugs: 7.5,
          refund: 5,
          extra: 5,
        },
        experience: {
          completion: 100,
          extra: 3,
        },
        note: "Note",
        completed: true,
      })
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":true,"appq_prospect":true}'
      );
    const prospect = await tryber.tables.WpAppqProspectPayout.do()
      .select()
      .where("campaign_id", 1);
    expect(prospect.length).toBe(1);
    expect(prospect[0]).toEqual(
      expect.objectContaining({
        campaign_id: 1,
        tester_id: 1,
        complete_eur: 10.5,
        bonus_bug_eur: 7.5,
        refund: 5,
        extra_eur: 5,
        complete_pts: 100,
        extra_pts: 3,
        notes: "Note",
        is_completed: 1,
      })
    );
  });
});
