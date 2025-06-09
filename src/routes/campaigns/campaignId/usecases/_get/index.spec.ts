import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("GET /campaigns/{CampaignId}/usecases", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        id: 100,
        title: "Campaign 1",
        customer_title: "Customer Campaign 1",
        platform_id: 1,
        start_date: "2023-01-01",
        end_date: "2023-12-31",
        page_preview_id: 1,
        page_manual_id: 1,
        customer_id: 1,
        pm_id: 11111,
        project_id: 1,
      },
      {
        id: 110,
        title: "Campaign 110",
        customer_title: "Customer Campaign 110",
        platform_id: 1,
        start_date: "2023-01-01",
        end_date: "2023-12-31",
        page_preview_id: 1,
        page_manual_id: 1,
        customer_id: 1,
        pm_id: 11111,
        project_id: 1,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
  });
  it("Should answer 400 if campaign does not exist", async () => {
    const response = await request(app)
      .get("/campaigns/999/usecases")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Campaign not found",
    });
  });
  it("Should answer 200 if logged in as admin", async () => {
    const response = await request(app)
      .get("/campaigns/100/usecases")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should answer 403 if logged in as non admin", async () => {
    const response = await request(app)
      .get("/campaigns/100/usecases")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should return an empty array if no usecases are found", async () => {
    const response = await request(app)
      .get("/campaigns/110/usecases")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
