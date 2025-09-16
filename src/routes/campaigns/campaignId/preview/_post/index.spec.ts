import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

describe("POST /campaigns/:campaignId/preview", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().insert({
      id: 1,
      wp_user_id: 1,
      email: "profile1@example.com",
      employment_id: 1,
      education_id: 1,
    });
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        id: 1,
        project_id: 1,
        title: "Campaign 1",
        start_date: "2024-01-01 00:00:00",
        end_date: "2024-12-31 23:59:59",
        platform_id: 1,
        page_manual_id: 1,
        page_preview_id: 1,
        customer_id: 1,
        customer_title: "Customer 1",
        pm_id: 11111,
        page_version: "v1",
      },
      {
        id: 2,
        project_id: 1,
        title: "Campaign 2",
        start_date: "2024-01-01 00:00:00",
        end_date: "2024-12-31 23:59:59",
        platform_id: 1,
        page_manual_id: 1,
        page_preview_id: 1,
        customer_id: 1,
        customer_title: "Customer 2",
        pm_id: 11112,
        page_version: "v2",
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
  });
  it("Should answer 403 if user is not logged in ", async () => {
    const response = await request(app).post("/campaigns/1/preview");
    expect(response.status).toBe(403);
  });
  it("Should answer 403 if user is logged in without olp appq_campaign", async () => {
    const response = await request(app)
      .post("/campaigns/1/preview")
      .send({ content: "<payout>Content</payout>" })
      .set("authorization", `Bearer tester olp {"appq_campaign":false}`);
    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      message: "You are not authorized.",
    });
  });
  it("Should return an error if campaign does not exist", async () => {
    const response = await request(app)
      .post("/campaigns/999/preview")
      .send({ content: "<payout>Content</payout>" })
      .set("authorization", `Bearer tester olp {"appq_campaign":true}`);
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Campaign not found",
    });
  });
  it("Should answer 403 if user try to send preview to campaign not in v2", async () => {
    const response = await request(app)
      .post("/campaigns/1/preview")
      .send({ content: "<payout>Content</payout>" })
      .set("authorization", `Bearer tester olp {"appq_campaign":true}`);
    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      message: "You cannot send preview. Campaign is not in v2",
    });
  });

  it("Should answer 200 if user is admin", async () => {
    const response = await request(app)
      .post("/campaigns/2/preview")
      .send({ content: "<payout>Content</payout>" })
      .set("authorization", `Bearer admin`);
    expect(response.status).toBe(200);
  });

  it("Should insert content on preview table", async () => {
    const response = await request(app)
      .post("/campaigns/2/preview")
      .send({ content: "<payout>Content</payout>" })
      .set("authorization", `Bearer admin`);
    expect(response.status).toBe(200);
    const preview = await tryber.tables.CampaignPreviews.do()
      .select("*")
      .where({ campaign_id: 2 })
      .first();
    expect(preview).toBeDefined();
    expect(preview).toMatchObject({
      campaign_id: 2,
      content: "<payout>Content</payout>",
    });
  });
});
