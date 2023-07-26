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
const requestBody = {
  insights: [],
  sentiments: [],
};
const singleInsight = {
  title: "Insight Title",
  description: "Insight Description",
  severityId: 1,
  order: 2,
  clusterIds: "all",
  videoPart: [],
};

describe("PATCH /campaigns/{campaignId}/ux - CASE: publish first time a draft", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 99 },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
  });
  afterEach(async () => {
    await tryber.tables.UxCampaignInsights.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
  });

  it("should return 200", async () => {
    const response = await request(app)
      .patch("/campaigns/99/ux")
      .send(requestBody)
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should insert the first version as published", async () => {
    await request(app)
      .patch("/campaigns/99/ux")
      .send({
        status: "publish",
        ...requestBody,
        insights: [singleInsight],
      })
      .set("Authorization", "Bearer admin");
    const uxData = await tryber.tables.UxCampaignData.do().select();
    expect(uxData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          campaign_id: 99,
          version: 1,
          published: 1,
        }),
      ])
    );
    const insightData = await tryber.tables.UxCampaignInsights.do().select();
    expect(insightData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          campaign_id: 99,
          version: 1,
          cluster_ids: "0",
          description: "Insight Description",
          order: 2,
          severity_id: 1,
          title: "Insight Title",
        }),
      ])
    );
  });
});
