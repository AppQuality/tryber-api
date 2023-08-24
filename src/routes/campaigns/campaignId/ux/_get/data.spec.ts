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
describe("GET /campaigns/{campaignId}/ux - data", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 1, campaign_type_id: 10 },
    ]);
    await tryber.tables.WpAppqCampaignType.do().insert([
      {
        id: 1,
        name: "UX Generic",
        category_id: 1,
      },
      {
        id: 10,
        name: "Usability Test",
        category_id: 1,
        description: "Ux Description",
      },
    ]);
    await tryber.tables.UxCampaignData.do().insert({
      campaign_id: 1,
      version: 1,
      methodology_description: "Ux Description",
      methodology_type: "qualitative",
      goal: "This is the goal of the reasearch",
      users: 100,
    });
    await tryber.tables.UxCampaignInsights.do().insert([
      {
        id: 1,
        campaign_id: 1,
        version: 1,
        title: "Test Insight",
        description: "Test Description",
        severity_id: 1,
        cluster_ids: "1,2",
        order: 1,
      },
      {
        id: 2,
        campaign_id: 1,
        version: 1,
        title: "Test Insight All Cluster",
        description: "Test Description All Cluster",
        severity_id: 1,
        cluster_ids: "0",
        order: 0,
      },
    ]);
    await tryber.tables.WpAppqUsecaseCluster.do().insert([
      {
        id: 1,
        campaign_id: 1,
        title: "Test Cluster",
        subtitle: "",
      },
      {
        id: 2,
        campaign_id: 1,
        title: "Test Cluster 2",
        subtitle: "",
      },
    ]);

    await tryber.tables.UxCampaignVideoParts.do().insert({
      id: 1,
      insight_id: 1,
      start: 0,
      end: 10,
      order: 0,
      media_id: 1,
      description: "Test Description",
    });
    await tryber.tables.WpAppqUserTaskMedia.do().insert({
      id: 1,
      campaign_task_id: 1,
      user_task_id: 1,
      location: "http://example.com/video.mp4",
      tester_id: 1,
    });
    await tryber.tables.UxCampaignQuestions.do().insert([
      {
        campaign_id: 1,
        question: "Why the world is round?",
        version: 1,
      },
      {
        campaign_id: 1,
        question: "How many stars are in the sky?",
        version: 1,
      },
      {
        campaign_id: 2,
        question: "Be or not to be?",
        version: 1,
      },
    ]);
    await tryber.tables.UxCampaignSentiments.do().insert([
      {
        cluster_id: 1,
        campaign_id: 1,
        value: 1,
        comment: "Low Comment cluster1",
        version: 1,
      },
      {
        cluster_id: 2,
        campaign_id: 1,
        value: 5,
        comment: "High Comment cluster2",
        version: 1,
      },
      {
        cluster_id: 1,
        campaign_id: 2,
        value: 5,
        comment: "Medium Comment cluster1",
        version: 1,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.UxCampaignInsights.do().delete();
    await tryber.tables.WpAppqUsecaseCluster.do().delete();
    await tryber.tables.UxCampaignVideoParts.do().delete();
    await tryber.tables.WpAppqUserTaskMedia.do().delete();
    await tryber.tables.UxCampaignQuestions.do().delete();
    await tryber.tables.UxCampaignSentiments.do().delete();
  });

  it("Should return all the findings", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("insights");
    expect(response.body.insights).toHaveLength(2);
    expect(response.body.insights[0]).toEqual(
      expect.objectContaining({
        title: "Test Insight All Cluster",
        description: "Test Description All Cluster",
        severity: expect.objectContaining({
          id: 1,
          name: "Minor",
        }),
        clusters: "all",
        videoParts: expect.arrayContaining([]),
      })
    );
    expect(response.body.insights[1]).toEqual(
      expect.objectContaining({
        title: "Test Insight",
        description: "Test Description",
        severity: expect.objectContaining({
          id: 1,
          name: "Minor",
        }),
        clusters: [
          expect.objectContaining({
            id: 1,
            name: "Test Cluster",
          }),
          expect.objectContaining({
            id: 2,
            name: "Test Cluster 2",
          }),
        ],
        videoParts: expect.arrayContaining([]),
      })
    );
  });

  it("Should return all the video part in a finding", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("insights");
    expect(response.body.insights).toHaveLength(2);
    expect(response.body.insights[1]).toEqual(
      expect.objectContaining({
        id: 1,
        videoParts: expect.arrayContaining([]),
      })
    );
    expect(response.body.insights[1].videoParts).toHaveLength(1);
    expect(response.body.insights[1].videoParts[0]).toEqual(
      expect.objectContaining({
        start: 0,
        end: 10,
        description: "Test Description",
        mediaId: 1,
        url: "http://example.com/video.mp4",
        streamUrl: "http://example.com/video-stream.m3u8",
      })
    );
  });

  it("Should return the questions", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("questions");
    expect(Array.isArray(response.body.questions)).toBe(true);
  });
  it("Should return all the questions", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body.questions).toHaveLength(2);
    expect(response.body.questions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Why the world is round?",
        }),
        expect.objectContaining({
          name: "How many stars are in the sky?",
        }),
      ])
    );
  });

  it("Should return the sentiments", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("sentiments");
    expect(Array.isArray(response.body.questions)).toBe(true);
  });
  it("Should return all the sentiments", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body.sentiments).toHaveLength(2);
    expect(response.body.sentiments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: 1,
          comment: "Low Comment cluster1",
          cluster: {
            id: 1,
            name: "Test Cluster",
          },
        }),
        expect.objectContaining({
          value: 5,
          comment: "High Comment cluster2",
          cluster: {
            id: 2,
            name: "Test Cluster 2",
          },
        }),
      ])
    );
  });

  it("Should return methodology", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("methodology");
  });

  it("Should return methodology name", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body.methodology).toHaveProperty("name");
    expect(response.body.methodology.name).toEqual("Usability Test");
  });

  it("Should return methodology description from ux data if exist", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body.methodology).toHaveProperty("description");
    expect(response.body.methodology.description).toEqual("Ux Description");
  });

  it("Should return methodology type", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body.methodology).toHaveProperty("type");
    expect(response.body.methodology.type).toEqual("qualitative");
  });
  it("Should return research goal", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("goal");
    expect(response.body.goal).toEqual("This is the goal of the reasearch");
  });
  it("Should return research usersNumber", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("usersNumber");
    expect(response.body.usersNumber).toEqual(100);
  });
});
describe("GET /campaigns/{campaignId}/ux - data - no methodology description", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 1, campaign_type_id: 10 },
    ]);
    await tryber.tables.WpAppqCampaignType.do().insert([
      {
        id: 1,
        name: "UX Generic",
        category_id: 1,
      },
      {
        id: 10,
        name: "Usability Test",
        category_id: 1,
        description: "Campaign Type Description",
      },
    ]);
    await tryber.tables.UxCampaignData.do().insert({
      campaign_id: 1,
      version: 1,
      methodology_type: "quantitative",
      goal: "This is the goal of the reasearch",
      users: 100,
    });
    await tryber.tables.UxCampaignInsights.do().insert({
      id: 1,
      campaign_id: 1,
      version: 1,
      title: "Test Insight",
      description: "Test Description",
      severity_id: 1,
      cluster_ids: "1,2",
      order: 1,
    });
    await tryber.tables.UxCampaignInsights.do().insert({
      id: 2,
      campaign_id: 1,
      version: 1,
      title: "Test Insight All Cluster",
      description: "Test Description All Cluster",
      severity_id: 1,
      cluster_ids: "0",
      order: 0,
    });
    await tryber.tables.WpAppqUsecaseCluster.do().insert({
      id: 1,
      campaign_id: 1,
      title: "Test Cluster",
      subtitle: "",
    });
    await tryber.tables.WpAppqUsecaseCluster.do().insert({
      id: 2,
      campaign_id: 1,
      title: "Test Cluster 2",
      subtitle: "",
    });

    await tryber.tables.UxCampaignVideoParts.do().insert({
      id: 1,
      insight_id: 1,
      start: 0,
      end: 10,
      order: 0,
      media_id: 1,
      description: "Test Description",
    });
    await tryber.tables.WpAppqUserTaskMedia.do().insert({
      id: 1,
      campaign_task_id: 1,
      user_task_id: 1,
      location: "http://example.com/video.mp4",
      tester_id: 1,
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.UxCampaignInsights.do().delete();
    await tryber.tables.WpAppqUsecaseCluster.do().delete();
    await tryber.tables.UxCampaignVideoParts.do().delete();
    await tryber.tables.WpAppqUserTaskMedia.do().delete();
  });

  it("Should return methodology description from campaign type as default", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body.methodology).toHaveProperty("description");
    expect(response.body.methodology.description).toEqual(
      "Campaign Type Description"
    );
  });
});
