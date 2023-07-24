import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const campaign = {
  title: "Test Campaign",
  platform_id: 1,
  start_date: "2021-01-01",
  end_date: "2021-01-01",
  pm_id: 1,
  page_manual_id: 1,
  page_preview_id: 1,
  customer_id: 1,
  project_id: 1,
  customer_title: "Test Customer",
};

describe("GET /campaigns/{campaignId}/ux - draft modified", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([{ ...campaign, id: 1 }]);
    await tryber.tables.UxCampaignData.do().insert({
      campaign_id: 1,
      version: 1,
      published: 1,
    });
    await tryber.tables.UxCampaignData.do().insert({
      campaign_id: 1,
      version: 2,
      published: 0,
    });
    await tryber.tables.UxCampaignInsights.do().insert({
      campaign_id: 1,
      version: 1,
      title: "Test Insight",
      description: "Test Description",
      severity_id: 1,
      cluster_ids: "1",
      order: 0,
    });
    await tryber.tables.UxCampaignInsights.do().insert({
      campaign_id: 1,
      version: 2,
      title: "Test Modified",
      description: "Test Description",
      severity_id: 1,
      cluster_ids: "1",
      order: 0,
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.UxCampaignInsights.do().delete();
  });

  it("Should return status published if there are published campaign data and data are not equal to last draft", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("status", "draft-modified");
  });
});
