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

describe("PATCH /campaigns/{campaignId}/ux - from empty", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([{ ...campaign, id: 1 }]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
  });

  afterEach(async () => {
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.UxCampaignInsights.do().delete();
    await tryber.tables.UxCampaignVideoParts.do().delete();
  });

  it("Should insert insight as draft if status is not provided", async () => {
    const response = await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        insights: [
          {
            title: "My insight",
            description: "My description",
            severityId: 1,
            order: 0,
            clusterIds: "all",
            videoPart: [],
          },
        ],
        sentiments: [],
      });
    console.log(response.body);
    const data = await tryber.tables.UxCampaignData.do().select(
      "version",
      "published",
      "campaign_id"
    );
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual(
      expect.objectContaining({
        version: 1,
        published: 0,
        campaign_id: 1,
      })
    );
  });

  it("Should return 400 on publish", async () => {
    const response = await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        status: "publish",
      });
    expect(response.status).toBe(400);
  });
});
