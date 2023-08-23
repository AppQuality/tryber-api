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
        goal: "This is the goal of the reasearch",
        users: 99,
      },
      {
        campaign_id: 1,
        version: 2,
        published: 0,
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
        goal: "This is the goal of the reasearch",
        users: 99,
      },
      {
        campaign_id: 1,
        version: 2,
        published: 0,
        methodology_type: "quantitative",
        goal: "This is the NEW goal of the reasearch",
        users: 100,
      },
    ]);
    await tryber.tables.UxCampaignInsights.do().insert({
      id: 1,
      campaign_id: 1,
      version: 1,
      title: "Test Insight",
      description: "Test Description",
      severity_id: 1,
      cluster_ids: "1",
      order: 0,
    });
    await tryber.tables.UxCampaignInsights.do().insert({
      id: 2,
      campaign_id: 1,
      version: 2,
      title: "Test Insight",
      description: "Test Description",
      severity_id: 1,
      cluster_ids: "1",
      order: 0,
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

describe("GET /campaigns/{campaignId}/ux - draft modified - methodology no description", () => {
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
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.UxCampaignInsights.do().delete();
  });
  it("Should return methodology description from ux data if exist", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body.methodology).toHaveProperty("description");
    expect(response.body.methodology.description).toEqual(
      "Campaign Type Description"
    );
  });
});
