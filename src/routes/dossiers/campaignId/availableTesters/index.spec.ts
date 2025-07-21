import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("Route PUT /dossiers/:id/availableTesters", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 1,
      title: "Campaign 1",
      customer_title: "Campaign 1",
      start_date: "2023-01-01",
      end_date: "2023-12-31",
      pm_id: 1,
      platform_id: 1,
      page_preview_id: 1,
      page_manual_id: 1,
      customer_id: 1,
      project_id: 1,
      is_public: 4, // Target visibility
    });

    await tryber.tables.CampaignDossierData.do().insert({
      id: 1,
      campaign_id: 1,
      link: "",
      created_by: 1,
      updated_by: 1,
    });
  });

  afterAll(async () => {
    await tryber.tables.CampaignDossierData.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
  });

  afterEach(async () => {
    await tryber.tables.WpAppqCpMeta.do().delete();
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/dossiers/1/availableTesters");
    expect(response.status).toBe(403);
  });

  it("Should answer 403 if campaign does not exists", async () => {
    const response = await request(app).get("/dossiers/10");
    expect(response.status).toBe(403);
  });

  it("Should answer 403 if not admin", async () => {
    const response = await request(app)
      .get("/dossiers/1/availableTesters")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should answer 200 if admin", async () => {
    const response = await request(app)
      .get("/dossiers/1/availableTesters")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should answer 200 if user has access to the campaign", async () => {
    const response = await request(app)
      .get("/dossiers/1/availableTesters")

      .set("authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(200);
  });

  it("Should answer 200 if user has access to the campaign", async () => {
    const response = await request(app)
      .get("/dossiers/1/availableTesters")

      .set("authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
  });
});
