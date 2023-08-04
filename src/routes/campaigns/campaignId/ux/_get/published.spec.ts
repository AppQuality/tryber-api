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
describe("GET /campaigns/{campaignId}/ux - published", () => {
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
        metodology_description: "Ux Description",
        metodology_type: "qualitative",
        goal: "This is the goal of the reasearch",
        users: 100,
      },
      {
        campaign_id: 1,
        version: 2,
        published: 0,
        metodology_description: "Ux Description",
        metodology_type: "qualitative",
        goal: "This is the goal of the reasearch",
        users: 100,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
  });

  it("Should return status published if there are published campaign data and data are equal to last draft", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("status", "published");
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
  it("Should return metodology desciption", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body.metodology).toHaveProperty("description");
    expect(response.body.metodology.description).toEqual("Ux Description");
  });

  it("Should return metodology type", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body.metodology).toHaveProperty("type");
    expect(response.body.metodology.type).toEqual("qualitative");
  });

  it("Should return metodology goal", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("goal");
    expect(response.body.goal).toEqual("This is the goal of the reasearch");
  });
});
