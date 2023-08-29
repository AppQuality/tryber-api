import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

beforeAll(async () => {
  await tryber.tables.WpAppqEvdCampaign.do().insert({
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
    campaign_type_id: 9,
  });
  await tryber.tables.WpAppqCampaignType.do().insert([
    {
      id: 1,
      name: "functional",
      category_id: 1,
    },
    {
      id: 9,
      name: "ux",
      category_id: 1,
    },
  ]);
});
describe("GET /campaigns/:campaignId", () => {
  it("Should return 400 if campaign does not exist", async () => {
    const response = await request(app)
      .get("/campaigns/999")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(400);
  });
  it("Should return 403 if the user does not have permission", async () => {
    const response = await request(app)
      .get("/campaigns/1")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 200 if the user have olp permission", async () => {
    const response = await request(app)
      .get("/campaigns/1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(200);
  });

  it("Should return 200 if the user is admin", async () => {
    const response = await request(app)
      .get("/campaigns/1")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should return campaign id", async () => {
    const response = await request(app)
      .get("/campaigns/1")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("id", 1);
  });
  it("Should return campaign title", async () => {
    const response = await request(app)
      .get("/campaigns/1")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("title", "This is the title");
  });

  it("Should return campaign type", async () => {
    const response = await request(app)
      .get("/campaigns/1")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("type", "ux");
  });
});
