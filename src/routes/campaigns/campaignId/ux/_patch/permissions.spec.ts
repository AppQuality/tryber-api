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
  project_id: 1,
  customer_title: "Test Customer",
};

const requestBody = {
  goal: "Test Goal",
  usersNumber: 5,
  sentiments: [],
  questions: [],
  methodology: {
    name: "Methodology Name",
    type: "qualitative",
    description: "Methodology Description",
  },
};

describe("PATCH /campaigns/{campaignId}/ux - permissions and logging statuses", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([{ ...campaign, id: 1 }]);
    await tryber.tables.UxCampaignData.do().insert({
      campaign_id: 1,
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
  });
  it("should return 403 if not logged in", async () => {
    const response = await request(app).patch("/campaigns/1/ux");
    expect(response.status).toBe(403);
  });
  it("Should return 403 if logged in as not admin user", async () => {
    const response = await request(app)
      .patch("/campaigns/1/ux")
      .send(requestBody)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 200 if logged as admin user", async () => {
    const response = await request(app)
      .patch("/campaigns/1/ux")
      .send(requestBody)
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should return 403 if campaign does not exists", async () => {
    const response = await request(app)
      .patch("/campaigns/999/ux")
      .send(requestBody)
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(403);
  });
});
