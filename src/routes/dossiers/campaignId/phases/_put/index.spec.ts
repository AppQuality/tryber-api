import app from "@src/app";
import { tryber } from "@src/features/database";
import { StatusChangeHandler } from "@src/routes/dossiers/campaignId/phases/_put/StatusChangeHandler";
import request from "supertest";

jest.mock("@src/routes/dossiers/campaignId/phases/_put/StatusChangeHandler");

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

    await tryber.tables.WpAppqProject.do().insert([
      { id: 1, customer_id: 1, display_name: "Project 1", edited_by: 1 },
    ]);
    await tryber.tables.WpAppqCustomer.do().insert([
      { id: 1, company: "Customer 1", pm_id: 1 },
    ]);
    await tryber.tables.WpAppqCampaignType.do().insert([
      { id: 1, name: "Type 1", category_id: 1 },
    ]);
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        id: 1,
        wp_user_id: 1,
        name: "CSM",
        surname: "",
        email: "",
        education_id: 1,
        employment_id: 1,
      },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.CampaignPhase.do().delete();
    await tryber.tables.CampaignPhaseType.do().delete();
    await tryber.tables.WpAppqProject.do().delete();
    await tryber.tables.WpAppqCustomer.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
  });

  beforeEach(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        id: 1,
        title: "Campaign 1",
        customer_title: "Customer 1",
        platform_id: 1,
        pm_id: 1,
        campaign_type_id: 1,
        page_manual_id: 1,
        page_preview_id: 1,
        start_date: "2021-01-01T00:00:00.000Z",
        end_date: "2021-12-31T00:00:00.000Z",
        close_date: "2022-01-01T00:00:00.000Z",
        customer_id: 1,
        project_id: 1,
        phase_id: 1,
        os: "",
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

  it("Should change the phase", async () => {
    const response = await request(app)
      .put("/dossiers/1/phases")
      .set("Authorization", "Bearer admin")
      .send({ phase: 2 });

    expect(response.status).toBe(200);

    const campaign = await request(app)
      .get("/dossiers/1")
      .set("Authorization", "Bearer admin");

    expect(campaign.body.phase.id).toBe(2);
    expect(campaign.body.phase.name).toBe("Running");
  });

  it("Should return the new phase", async () => {
    const response = await request(app)
      .put("/dossiers/1/phases")
      .set("Authorization", "Bearer admin")

      .send({ phase: 2 });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(2);
    expect(response.body.name).toBe("Running");
  });

  it("Should handle the status change", async () => {
    await request(app)
      .put("/dossiers/1/phases")
      .set("Authorization", "Bearer admin")
      .send({ phase: 2 });

    expect(StatusChangeHandler).toHaveBeenCalledWith(1, 2);
    expect(StatusChangeHandler.prototype.run).toHaveBeenCalled();
  });
});
