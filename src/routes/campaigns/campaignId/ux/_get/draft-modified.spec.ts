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
        metodology_type: "qualitative",
      },
      {
        campaign_id: 1,
        version: 2,
        published: 0,
        metodology_type: "qualitative",
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
        metodology_type: "qualitative",
      },
      {
        campaign_id: 1,
        version: 2,
        published: 0,
        metodology_type: "qualitative",
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

describe("GET /campaigns/{campaignId}/ux - draft modified - metodology", () => {
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
        metodology_desciption: "Test Description OLD",
        metodology_type: "qualitative",
      },
      {
        campaign_id: 1,
        version: 2,
        published: 0,
        metodology_desciption: "Test Description NEW",
        metodology_type: "qualitative",
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

  it("Should return metodology", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("metodology");
  });

  it("Should return metodology name", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body.metodology).toHaveProperty("name");
    expect(response.body.metodology.name).toEqual("Usability Test");
  });
  it("Should return metodology description from ux data if exist", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body.metodology).toHaveProperty("description");
    expect(response.body.metodology.description).toEqual(
      "Test Description NEW"
    );
  });
});

describe("GET /campaigns/{campaignId}/ux - draft modified - metodology no description", () => {
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
        metodology_desciption: "Test Description OLD",
        metodology_type: "qualitative",
      },
      {
        campaign_id: 1,
        version: 2,
        published: 0,
        metodology_type: "qualitative",
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

  it("Should return metodology", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("metodology");
  });

  it("Should return metodology name", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body.metodology).toHaveProperty("name");
    expect(response.body.metodology.name).toEqual("Usability Test");
  });
  it("Should return metodology description from ux data if exist", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body.metodology).toHaveProperty("description");
    expect(response.body.metodology.description).toEqual(
      "Campaign Type Description"
    );
  });
});
