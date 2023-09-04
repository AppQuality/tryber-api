import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

jest.mock("@src/features/checkUrl", () => ({
  checkUrl: jest.fn().mockImplementation(() => true),
}));
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

const methodology = {
  type: "qualitative",
  description: "Methodology Description",
};

describe("PATCH /campaigns/{campaignId}/ux - from draft modified", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 123 },
    ]);
    await tryber.tables.WpAppqUsecaseCluster.do().insert([
      {
        id: 1,
        title: "Cluster 1",
        subtitle: "Subtitle 1",
        campaign_id: 123,
      },
    ]);
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

    await tryber.tables.UxCampaignData.do().insert([
      {
        campaign_id: 123,
        version: 1,
        published: 1,
      },
      {
        campaign_id: 123,
        version: 2,
        published: 0,
      },
    ]);

    await tryber.tables.UxCampaignInsights.do().insert([
      {
        id: 1,
        campaign_id: 123,
        version: 1,
        title: "Publish insight",
        description: "Publish description",
        severity_id: 1,
        cluster_ids: "1",
      },
      {
        id: 2,
        campaign_id: 123,
        version: 1,
        title: "Publish insight 2",
        description: "Publish description 2",
        severity_id: 1,
        cluster_ids: "1",
      },
      // Draft modified insights
      {
        id: 3,
        campaign_id: 123,
        version: 2,
        title: "Publish insight",
        description: "Publish description",
        severity_id: 1,
        cluster_ids: "1",
      },
      {
        id: 4,
        campaign_id: 123,
        version: 2,
        title: "Publish insight 2",
        description: "Publish description 2",
        severity_id: 1,
        cluster_ids: "1",
      },
    ]);

    await tryber.tables.UxCampaignVideoParts.do().insert([
      {
        id: 1,
        media_id: 1,
        insight_id: 2,
        start: 0,
        end: 10,
        description: "Publish video part",
      },
      {
        id: 2,
        media_id: 1,
        insight_id: 4,
        start: 0,
        end: 10,
        description: "Publish video part",
      },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.WpAppqUserTaskMedia.do().delete();
    await tryber.tables.UxCampaignInsights.do().delete();
    await tryber.tables.UxCampaignVideoParts.do().delete();
    await tryber.tables.UxCampaignQuestions.do().delete();
  });

  it("Should not remove anything from latest draft", async () => {
    await request(app)
      .patch("/campaigns/123/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        insights: [
          {
            id: 3,
            title: "Publish insight",
            description: "Publish description",
            order: 0,
            severityId: 1,
            clusterIds: [1],
            videoParts: [],
          },
          {
            id: 4,
            title: "Publish insight 2",
            description: "Publish description 2",
            order: 0,
            severityId: 1,
            clusterIds: [1],
            videoParts: [
              {
                id: 2,
                order: 0,
                start: 0,
                end: 10,
                mediaId: 1,
                description: "Publish video part",
              },
            ],
          },
        ],
        sentiments: [],
        questions: [],
        methodology,
      });

    const data = await tryber.tables.UxCampaignData.do().select(
      "version",
      "published",
      "campaign_id"
    );
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual(
      expect.objectContaining({
        version: 1,
        published: 1,
        campaign_id: 123,
      })
    );
    expect(data[1]).toEqual(
      expect.objectContaining({
        version: 2,
        published: 0,
        campaign_id: 123,
      })
    );

    const videoParts = await tryber.tables.UxCampaignVideoParts.do().select();

    expect(videoParts.length).toBe(2);
  });
});
