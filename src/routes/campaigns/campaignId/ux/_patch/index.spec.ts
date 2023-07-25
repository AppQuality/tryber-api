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
const requestBody = {
  insights: [],
  sentiments: [],
};
describe("PATCH /campaigns/{campaignId}/ux - permissions and loggin statuses", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([{ ...campaign, id: 1 }]);
    await tryber.tables.UxCampaignData.do().insert({
      campaign_id: 1,
      version: 1,
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

describe("PATCH /campaigns/{campaignId}/ux - CASE: publish first time a draft", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 99 },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
  });
  it("should return 200", async () => {
    const response = await request(app)
      .patch("/campaigns/99/ux")
      .send(requestBody)
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });
  //
  it("Should insert a new insight", async () => {
    const response = await request(app)
      .patch("/campaigns/99/ux")
      .send({
        ...requestBody,
        insights: [
          {
            id: 1,
            title: "test",
            description: "test",
            severityId: 1,
            order: 1,
            clusterId: "all",
            videoPart: [],
          },
        ],
      })
      .set("Authorization", "Bearer admin");
    console.log(response.body);
    const insight = await tryber.tables.UxCampaignData.do().select().first();
    expect(insight).not.toBeUndefined();
    console.log(insight);

    expect(response.status).toBe(200);
  });
});
