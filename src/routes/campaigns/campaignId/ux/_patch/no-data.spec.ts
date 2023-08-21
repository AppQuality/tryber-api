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

const metodology = {
  type: "qualitative",
  description: "Metodology Description",
};

describe("PATCH /campaigns/{campaignId}/ux - from empty", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([{ ...campaign, id: 1 }]);
    await tryber.tables.WpAppqUserTaskMedia.do().insert([
      {
        id: 1,
        campaign_task_id: 1,
        user_task_id: 1,
        tester_id: 1,
        location:
          "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.WpAppqUserTaskMedia.do().delete();
  });

  afterEach(async () => {
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.UxCampaignInsights.do().delete();
    await tryber.tables.UxCampaignVideoParts.do().delete();
  });

  it("Should insert data as draft", async () => {
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
            videoParts: [],
          },
        ],
        sentiments: [],
        metodology,
      });
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

  it("Should insert insight as draft", async () => {
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
            videoParts: [],
          },
        ],
        sentiments: [],
        metodology,
      });
    const data = await tryber.tables.UxCampaignInsights.do().select();
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual(
      expect.objectContaining({
        cluster_ids: "0",
        description: "My description",
        order: 0,
        severity_id: 1,
        title: "My insight",
      })
    );
  });

  it("Should insert insight videopart as draft", async () => {
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
            videoParts: [
              {
                start: 0,
                end: 10,
                mediaId: 1,
                description: "My video",
                order: 0,
              },
            ],
          },
        ],
        sentiments: [],
        metodology,
      });

    const data = await tryber.tables.UxCampaignInsights.do().select();
    expect(data).toHaveLength(1);
    const insightId = data[0].id;
    const videoParts = await tryber.tables.UxCampaignVideoParts.do().select();
    expect(videoParts).toHaveLength(1);
    expect(videoParts[0]).toEqual(
      expect.objectContaining({
        start: 0,
        end: 10,
        media_id: 1,
        description: "My video",
        order: 0,
        insight_id: insightId,
      })
    );
  });

  it("Should insert metodology type as draft", async () => {
    const response = await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        insights: [],
        sentiments: [],
        metodology,
      });

    const data = await tryber.tables.UxCampaignData.do()
      .select("metodology_type", "version", "published")
      .first();
    expect(data?.metodology_type).toBeDefined();
    expect(data?.metodology_type).toEqual(metodology.type);
    expect(data?.published).toEqual(0);
    expect(data?.version).toEqual(1);
  });

  it("Should insert metodology description as draft", async () => {
    const response = await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        insights: [],
        sentiments: [],
        metodology,
      });
    const data = await tryber.tables.UxCampaignData.do()
      .select("metodology_description", "version", "published")
      .first();
    expect(data?.metodology_description).toBeDefined();
    expect(data?.metodology_description).toEqual(metodology.description);
    expect(data?.published).toEqual(0);
    expect(data?.version).toEqual(1);
  });

  it("Should return 400 if inserting video part with invalid media id", async () => {
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
            videoParts: [
              {
                start: 0,
                end: 10,
                mediaId: 99,
                description: "My video",
                order: 0,
              },
            ],
          },
        ],
        sentiments: [],
        metodology,
      });

    expect(response.status).toBe(400);
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
