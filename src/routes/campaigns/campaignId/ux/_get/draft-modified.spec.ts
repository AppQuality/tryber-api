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

describe("GET /campaigns/{campaignId}/ux - draft modified - insight", () => {
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
        description: "Description",
      },
    ]);
    await tryber.tables.UxCampaignData.do().insert([
      {
        campaign_id: 1,
        version: 1,
        published: 1,
        methodology_type: "qualitative",
        methodology_description: "Test Description",
        goal: "This is the goal of the reasearch",
        users: 99,
      },
      {
        campaign_id: 1,
        version: 2,
        published: 0,
        methodology_type: "quantitative",
        methodology_description: "Test Description",
        goal: "This is the NEW goal of the reasearch",
        users: 100,
      },
    ]);
    await tryber.tables.UxCampaignInsights.do().insert([
      {
        campaign_id: 1,
        version: 1,
        title: "Test Insight",
        description: "Test Description",
        severity_id: 1,
        cluster_ids: "1",
        order: 0,
        finding_id: 10,
        enabled: 1,
      },
      {
        campaign_id: 1,
        version: 2,
        title: "Test Modified",
        description: "Test Description",
        severity_id: 1,
        cluster_ids: "1",
        order: 0,
        finding_id: 20,
        enabled: 1,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
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

describe("GET /campaigns/{campaignId}/ux - draft modified - video part", () => {
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
        description: "Description",
      },
    ]);
    await tryber.tables.UxCampaignData.do().insert([
      {
        campaign_id: 1,
        version: 1,
        published: 1,
        methodology_type: "qualitative",
        methodology_description: "Test Description",
        goal: "This is the goal of the reasearch",
        users: 99,
      },
      {
        campaign_id: 1,
        version: 2,
        published: 0,
        methodology_type: "quantitative",
        methodology_description: "Test Description",
        goal: "This is the NEW goal of the reasearch",
        users: 100,
      },
    ]);
    await tryber.tables.UxCampaignInsights.do().insert([
      {
        id: 1,
        campaign_id: 1,
        version: 1,
        title: "Test Insight",
        description: "Test Description",
        severity_id: 1,
        cluster_ids: "1",
        order: 0,
        finding_id: 10,
        enabled: 1,
      },
      {
        id: 2,
        campaign_id: 1,
        version: 2,
        title: "Test Insight",
        description: "Test Description",
        severity_id: 1,
        cluster_ids: "1",
        order: 0,
        finding_id: 20,
        enabled: 1,
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

    await tryber.tables.UxCampaignVideoParts.do().insert({
      id: 2,
      insight_id: 2,
      start: 0,
      end: 100,
      order: 0,
      media_id: 1,
      description: "Test Description",
    });
    await tryber.tables.WpAppqUserTaskMedia.do().insert({
      id: 2,
      campaign_task_id: 1,
      user_task_id: 1,
      location: "http://example.com/video.mp4",
      tester_id: 1,
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.UxCampaignInsights.do().delete();
    await tryber.tables.UxCampaignVideoParts.do().delete();
    await tryber.tables.WpAppqUserTaskMedia.do().delete();
  });

  it("Should return status published if there are published campaign data and data are not equal to last draft", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("status", "draft-modified");
  });
});

describe("GET /campaigns/{campaignId}/ux - draft modified - ux data", () => {
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
      },
    ]);
    await tryber.tables.UxCampaignData.do().insert([
      {
        campaign_id: 1,
        version: 1,
        published: 1,
        methodology_description: "Test Description OLD",
        methodology_type: "qualitative",
        goal: "This is the goal of the reasearch",
        users: 99,
      },
      {
        campaign_id: 1,
        version: 2,
        published: 0,
        methodology_description: "Test Description NEW",
        methodology_type: "quantitative",
        goal: "This is the NEW goal of the reasearch",
        users: 100,
      },
    ]);
    await tryber.tables.UxCampaignInsights.do().insert({
      campaign_id: 1,
      version: 1,
      title: "Test Insight",
      description: "Test Description",
      severity_id: 1,
      cluster_ids: "1",
      order: 0,
      finding_id: 10,
      enabled: 1,
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.UxCampaignInsights.do().delete();
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
    expect(response.body.methodology.description).toEqual(
      "Test Description NEW"
    );
  });
  it("Should return methodology type", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body.methodology).toHaveProperty("type");
    expect(response.body.methodology.type).toEqual("quantitative");
  });
  it("Should return research goal", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("goal");
    expect(response.body.goal).toEqual("This is the NEW goal of the reasearch");
  });

  it("Should return research usersNumber", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("usersNumber");
    expect(response.body.usersNumber).toEqual(100);
  });
});

describe("GET /campaigns/{campaignId}/ux - draft modified - questions", () => {
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
    await tryber.tables.UxCampaignData.do().insert([
      {
        campaign_id: 1,
        version: 1,
        published: 1,
        methodology_description: "Test Description OLD",
        methodology_type: "qualitative",
        goal: "This is the goal of the reasearch",
        users: 99,
      },
      {
        campaign_id: 1,
        version: 2,
        published: 0,
        methodology_type: "quantitative",
        methodology_description: "Test Description NEW",
        goal: "This is the NEW goal of the reasearch",
        users: 100,
      },
    ]);
    await tryber.tables.UxCampaignInsights.do().insert({
      campaign_id: 1,
      version: 1,
      title: "Test Insight",
      description: "Test Description",
      severity_id: 1,
      cluster_ids: "1",
      order: 0,
      finding_id: 10,
      enabled: 1,
    });
    await tryber.tables.UxCampaignQuestions.do().insert([
      {
        id: 1,
        campaign_id: 1,
        version: 2,
        question: "Test Question1 draft-modified",
      },
      {
        id: 2,
        campaign_id: 1,
        version: 2,
        question: "Test Question2 draft-modified",
      },
      {
        id: 3,
        campaign_id: 1,
        version: 1,
        question: "Test Question1 published",
      },
      {
        id: 4,
        campaign_id: 1,
        version: 1,
        question: "Test Question2 published",
      },
      {
        id: 5,
        campaign_id: 12,
        version: 1,
        question: "Test Question1 other campaign",
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.UxCampaignInsights.do().delete();
    await tryber.tables.UxCampaignQuestions.do().delete();
  });
  it("Should return questions of last draft version", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body.methodology).toHaveProperty("description");
    expect(response.body.questions.length).toEqual(2);
    expect(response.body.questions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          name: "Test Question1 draft-modified",
        }),
        expect.objectContaining({
          id: 2,
          name: "Test Question2 draft-modified",
        }),
      ])
    );
  });
});

describe("GET /campaigns/{campaignId}/ux - draft modified - sentiments", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 1, campaign_type_id: 1 },
    ]);
    await tryber.tables.WpAppqCampaignType.do().insert([
      {
        id: 1,
        name: "UX Generic",
        description: "Campaign Type Description",
        category_id: 1,
      },
    ]);
    await tryber.tables.UxCampaignData.do().insert([
      {
        campaign_id: 1,
        version: 1,
        published: 1,
        methodology_description: "Test Description OLD",
        methodology_type: "qualitative",
        goal: "This is the goal of the reasearch",
        users: 99,
      },
      {
        campaign_id: 1,
        version: 2,
        published: 0,
        methodology_type: "quantitative",
        methodology_description: "Test Description NEW",
        goal: "This is the NEW goal of the reasearch",
        users: 100,
      },
    ]);
    await tryber.tables.UxCampaignInsights.do().insert({
      campaign_id: 1,
      version: 1,
      title: "Test Insight",
      description: "Test Description",
      severity_id: 1,
      cluster_ids: "1",
      order: 0,
      finding_id: 10,
      enabled: 1,
    });
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
      {
        id: 3,
        campaign_id: 12,
        title: "Test Cluster CP12",
        subtitle: "",
      },
    ]);
    await tryber.tables.UxCampaignSentiments.do().insert([
      {
        id: 1,
        campaign_id: 1,
        cluster_id: 1,
        version: 2,
        value: 1,
        comment: "Sentiment1 draft-modified",
      },
      {
        id: 2,
        campaign_id: 1,
        version: 2,
        cluster_id: 2,
        value: 5,
        comment: "Sentiment2 draft-modified",
      },
      {
        id: 3,
        campaign_id: 1,
        version: 1,
        cluster_id: 1,
        value: 1,
        comment: "Sentiment1 published",
      },
      {
        id: 4,
        campaign_id: 1,
        version: 1,
        cluster_id: 2,
        value: 5,
        comment: "Sentiment2 published",
      },
      {
        id: 5,
        campaign_id: 12,
        version: 1,
        cluster_id: 3,
        value: 3,
        comment: "Sentiment1 other campaign",
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.UxCampaignInsights.do().delete();
    await tryber.tables.UxCampaignQuestions.do().delete();
    await tryber.tables.UxCampaignSentiments.do().delete();
    await tryber.tables.WpAppqUsecaseCluster.do().delete();
  });
  it("Should return sentiments of last draft version", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body.sentiments.length).toEqual(2);
    expect(response.body.sentiments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          comment: "Sentiment1 draft-modified",
          value: 1,
          cluster: {
            id: 1,
            name: "Test Cluster",
          },
        }),
        expect.objectContaining({
          id: 2,
          comment: "Sentiment2 draft-modified",
          value: 5,
          cluster: {
            id: 2,
            name: "Test Cluster 2",
          },
        }),
      ])
    );
  });
});
