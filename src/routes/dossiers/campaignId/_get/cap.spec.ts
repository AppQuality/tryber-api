import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("Route GET /dossiers/:id", () => {
  beforeAll(async () => {
    await tryber.tables.CampaignPhase.do().insert([
      {
        id: 1,
        name: "Active",
        type_id: 1,
      },
    ]);
    await tryber.tables.WpAppqCustomer.do().insert({
      id: 1,
      company: "Test Company",
      pm_id: 1,
    });
    await tryber.tables.WpAppqProject.do().insert({
      id: 1,
      display_name: "Test Project",
      customer_id: 1,
      edited_by: 1,
    });

    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        name: "Test",
        surname: "CSM",
        email: "",
        education_id: 1,
        employment_id: 1,
        id: 1,
        wp_user_id: 1,
      },
    ]);

    await tryber.tables.WpAppqCampaignType.do().insert({
      id: 1,
      name: "Test Type",
      description: "Test Description",
      category_id: 1,
    });

    await tryber.tables.WpAppqEvdPlatform.do().insert([
      {
        id: 1,
        name: "Test Device",
        form_factor: 0,
        architecture: 1,
      },
    ]);

    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 1,
      project_id: 1,
      campaign_type_id: 1,
      title: "Test Campaign",
      customer_title: "Test Customer Campaign",
      start_date: "2019-08-24T14:15:22Z",
      end_date: "2019-08-24T14:15:22Z",
      close_date: "2019-08-27T14:15:22Z",
      platform_id: 0,
      os: "1",
      page_manual_id: 0,
      page_preview_id: 0,
      pm_id: 1,
      desired_number_of_testers: 100,
    });
  });

  afterAll(async () => {
    await tryber.tables.WpAppqCustomer.do().delete();
    await tryber.tables.WpAppqProject.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.CampaignPhase.do().delete();
  });

  it("Should return cap", async () => {
    const response = await request(app)
      .get("/dossiers/1")
      .set("authorization", "Bearer admin");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("target");
    expect(response.body.target).toHaveProperty("cap", 100);
  });
});
