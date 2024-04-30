import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("Route PUT /dossiers/:id/phases", () => {
  beforeAll(async () => {
    await tryber.tables.CampaignPhase.do().insert([
      { id: 1, name: "Draft", type_id: 1 },
      { id: 2, name: "Running", type_id: 2 },
      { id: 3, name: "Closed", type_id: 3 },
    ]);

    await tryber.tables.CampaignPhaseType.do().insert([
      { id: 1, name: "unavailable" },
      { id: 2, name: "running" },
      { id: 3, name: "closed" },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.CampaignPhase.do().delete();
  });

  beforeEach(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        id: 1,
        title: "Campaign 1",
        customer_title: "Customer 1",
        platform_id: 1,
        pm_id: 1,
        page_manual_id: 1,
        page_preview_id: 1,
        start_date: "2021-01-01",
        end_date: "2021-12-31",
        customer_id: 1,
        project_id: 1,
        phase_id: 1,
      },
    ]);
  });

  afterEach(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
  });

  it("Should return 403 if not logged in", async () => {
    const response = await request(app)
      .put("/dossiers/1/phases")
      .send({ phase: 2 });
    expect(response.status).toBe(403);
  });

  it("Should return 200 if logged in as admin", async () => {
    const response = await request(app)
      .put("/dossiers/1/phases")
      .set("Authorization", "Bearer admin")
      .send({ phase: 2 });

    expect(response.status).toBe(200);
  });

  it("Should return 403 if logged in as tester", async () => {
    const response = await request(app)
      .put("/dossiers/1/phases")
      .set("Authorization", "Bearer tester")
      .send({ phase: 2 });

    expect(response.status).toBe(403);
  });

  it("Should return 200 if has access to the campaign", async () => {
    const response = await request(app)
      .put("/dossiers/1/phases")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}')
      .send({ phase: 2 });

    expect(response.status).toBe(200);
  });

  it("Should return 403 if campaign does not exists", async () => {
    const response = await request(app)
      .put("/dossiers/100/phases")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[100]}')
      .send({ phase: 2 });

    expect(response.status).toBe(403);
  });

  it("Should return 400 if sending the same phase_id", async () => {
    const response = await request(app)
      .put("/dossiers/1/phases")
      .set("Authorization", "Bearer admin")
      .send({ phase: 1 });

    expect(response.status).toBe(400);
  });
});
