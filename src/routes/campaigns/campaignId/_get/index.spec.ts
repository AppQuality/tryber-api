import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("GET /campaigns/:campaignId", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        id: 1,
        platform_id: 1,
        start_date: "2020-01-01",
        end_date: "2020-01-01",
        title: "This is the title",
        page_preview_id: 1,
        page_manual_id: 1,
        customer_id: 1,
        pm_id: 1,
        project_id: 1,
        customer_title: "",
        campaign_pts: 200,
        campaign_type_id: 1,
      },
      {
        id: 2,
        platform_id: 1,
        start_date: "2020-01-01",
        end_date: "2020-01-01",
        title: "This is the title",
        page_preview_id: 1,
        page_manual_id: 1,
        customer_id: 1,
        pm_id: 1,
        project_id: 1,
        customer_title: "",
        campaign_pts: 200,
        campaign_type_id: 9,
      },
    ]);
    await tryber.tables.WpAppqCampaignType.do().insert([
      {
        id: 1,
        name: "functional",
        description: "functional description",
        category_id: 1,
      },
      {
        id: 9,
        name: "ux",
        description: "ux description",
        category_id: 1,
      },
    ]);
    await tryber.tables.WpAppqCampaignPreselectionForm.do().insert([
      {
        id: 10,
        name: "Form CP99",
        campaign_id: 99,
        creation_date: "2020-01-01 00:00:00",
      },
      {
        id: 20,
        name: "Form CP2",
        campaign_id: 2,
        creation_date: "2024-01-01 00:00:00",
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.WpAppqCampaignPreselectionForm.do().delete();
  });
  it("Should return 400 if campaign does not exist", async () => {
    const response = await request(app)
      .get("/campaigns/999")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(400);
  });
  it("Should return 403 if the user does not have permission", async () => {
    const response = await request(app)
      .get("/campaigns/2")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 200 if the user have olp permission", async () => {
    const response = await request(app)
      .get("/campaigns/2")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,2]}');
    expect(response.status).toBe(200);
  });

  it("Should return 200 if the user is admin", async () => {
    const response = await request(app)
      .get("/campaigns/2")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should return campaign id", async () => {
    const response = await request(app)
      .get("/campaigns/2")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("id", 2);
  });
  it("Should return campaign title", async () => {
    const response = await request(app)
      .get("/campaigns/2")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("title", "This is the title");
  });

  it("Should return campaign type", async () => {
    const response = await request(app)
      .get("/campaigns/2")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("type", "ux");
  });

  it("Should return campaign description Type", async () => {
    const response = await request(app)
      .get("/campaigns/2")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("typeDescription", "ux description");
  });
  it("Should return campaign preselectionFormId", async () => {
    const response = await request(app)
      .get("/campaigns/2")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("preselectionFormId", 20);
  });
  it("Should not return campaign preselectionFormId if campaign form does not exist", async () => {
    const response = await request(app)
      .get("/campaigns/1")
      .set("Authorization", "Bearer admin");
    expect(response.body).toEqual({
      id: 1,
      title: "This is the title",
      type: "functional",
      typeDescription: "functional description",
      preselectionFormId: undefined,
    });
  });
});
