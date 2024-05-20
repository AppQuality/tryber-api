import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const baseRequest = {
  project: 1,
  testType: 1,
  title: {
    customer: "Campaign Title for Customer",
    tester: "Campaign Title for Tester",
  },
  startDate: "2019-08-24T14:15:22Z",
  deviceList: [1],
};

describe("Route PUT /dossiers/:id", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqProject.do().insert({
      id: 1,
      display_name: "Test Project",
      customer_id: 1,
      edited_by: 1,
    });

    await tryber.tables.WpAppqCampaignType.do().insert({
      id: 1,
      name: "Test Type",
      description: "Test Description",
      category_id: 1,
    });

    await tryber.tables.WpAppqEvdPlatform.do().insert([
      {
        id: 1,
        name: "Test Type",
        form_factor: 0,
        architecture: 1,
      },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.WpAppqProject.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
  });
  beforeEach(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 1,
      project_id: 1,
      campaign_type_id: 1,
      title: "Test Campaign",
      customer_title: "Test Customer Campaign",
      start_date: "2019-08-24T14:15:22Z",
      end_date: "2019-08-24T14:15:22Z",
      platform_id: 0,
      os: "1",
      page_manual_id: 0,
      page_preview_id: 0,
      pm_id: 1,
      customer_id: 0,
    });
  });
  afterEach(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).put("/dossiers/1").send(baseRequest);
    expect(response.status).toBe(403);
  });

  it("Should answer 403 if campaign does not exists", async () => {
    const response = await request(app).put("/dossiers/10").send(baseRequest);
    expect(response.status).toBe(403);
  });

  it("Should answer 403 if not admin", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer tester")
      .send(baseRequest);
    console.log(response.body);
    expect(response.status).toBe(403);
  });

  it("Should answer 400 if project does not exists", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, project: 10 });
    expect(response.status).toBe(400);
  });

  it("Should answer 400 if test type does not exists", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, testType: 10 });
    expect(response.status).toBe(400);
  });

  it("Should answer 400 if device type does not exists", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, deviceList: [10] });
    expect(response.status).toBe(400);
  });

  it("Should answer 200 if admin", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send(baseRequest);
    expect(response.status).toBe(200);
  });

  it("Should answer 200 if user has access to the campaign", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .send(baseRequest)
      .set("authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(200);
  });

  it("Should answer 200 if user has access to the campaign", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .send(baseRequest)
      .set("authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
  });
});
