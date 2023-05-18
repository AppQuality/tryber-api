import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

describe("PUT /campaigns/:campaignId/prospects/:testerId", () => {
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
      {
        id: 2,
        wp_user_id: 5,
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
        user_id: 5,
        campaign_id: 1,
        accepted: 0,
      },
    ]);
  });
  afterEach(async () => {
    await tryber.tables.WpAppqProspectPayout.do().delete();
  });
  it("should answer 403 if user is not logged in ", async () => {
    const response = await request(app).put("/campaigns/1/prospect/1");
    expect(response.status).toBe(403);
  });

  it("should answer 403 if user is not admin ", async () => {
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
      .set("authorization", `Bearer tester`);
    expect(response.status).toBe(403);
  });

  it("should answer 200 if user has tester_selection olp", async () => {
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
    expect(response.status).toBe(200);
  });

  it("should answer 403 if campaign does not exists", async () => {
    const response = await request(app)
      .put("/campaigns/5/prospect/1")
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
    expect(response.status).toBe(403);
  });

  it("should answer 403 if tester is not selected on campaign", async () => {
    const response = await request(app)
      .put("/campaigns/1/prospect/5")
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
    expect(response.status).toBe(403);
  });

  it("should answer with the new prospect row", async () => {
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
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
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
    });
  });
});
