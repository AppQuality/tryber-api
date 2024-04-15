import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("Route GET /dossiers/:id", () => {
  beforeAll(async () => {
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

    const profile = {
      name: "Test",
      surname: "Profile",
      email: "",
      education_id: 1,
      employment_id: 1,
    };
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        ...profile,
        id: 1,
        wp_user_id: 1,
        surname: "CSM",
      },
      {
        ...profile,
        id: 2,
        wp_user_id: 2,
        surname: "PM",
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
      platform_id: 0,
      os: "1",
      page_manual_id: 0,
      page_preview_id: 0,
      pm_id: 1,
      customer_id: 0,
    });

    await tryber.tables.CustomRoles.do().insert([
      {
        id: 1,
        name: "Test Role",
        olp: '["appq_bug"]',
      },
    ]);

    await tryber.tables.CampaignCustomRoles.do().insert({
      campaign_id: 1,
      custom_role_id: 1,
      tester_id: 2,
    });
  });

  afterAll(async () => {
    await tryber.tables.WpAppqCustomer.do().delete();
    await tryber.tables.WpAppqProject.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/dossiers/1");
    expect(response.status).toBe(403);
  });

  it("Should answer 403 if campaign does not exists", async () => {
    const response = await request(app).get("/dossiers/10");
    expect(response.status).toBe(403);
  });

  it("Should answer 403 if not admin", async () => {
    const response = await request(app)
      .get("/dossiers/1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should answer 200 if admin", async () => {
    const response = await request(app)
      .get("/dossiers/1")
      .set("authorization", "Bearer admin");
    console.log(response.body);
    expect(response.status).toBe(200);
  });

  it("Should return the campaign id", async () => {
    const response = await request(app)
      .get("/dossiers/1")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("id");
    expect(response.body.id).toBe(1);
  });
  it("Should return the campaign tester title", async () => {
    const response = await request(app)
      .get("/dossiers/1")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("title");
    expect(response.body.title).toHaveProperty("tester", "Test Campaign");
  });

  it("Should return the campaign customer title", async () => {
    const response = await request(app)
      .get("/dossiers/1")
      .set("authorization", "Bearer admin");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("title");
    expect(response.body.title).toHaveProperty(
      "customer",
      "Test Customer Campaign"
    );
  });

  it("Should return the project", async () => {
    const response = await request(app)
      .get("/dossiers/1")
      .set("authorization", "Bearer admin");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("project");
    expect(response.body.project).toHaveProperty("id", 1);
    expect(response.body.project).toHaveProperty("name", "Test Project");
  });

  it("Should return the test type", async () => {
    const response = await request(app)
      .get("/dossiers/1")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("testType");
    expect(response.body.testType).toHaveProperty("id", 1);
    expect(response.body.testType).toHaveProperty("name", "Test Type");
  });

  it("Should return the start date", async () => {
    const response = await request(app)
      .get("/dossiers/1")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("startDate", "2019-08-24T14:15:22Z");
  });

  it("Should return the end date", async () => {
    const response = await request(app)
      .get("/dossiers/1")
      .set("authorization", "Bearer admin");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("endDate", "2019-08-24T14:15:22Z");
  });

  it("Should return the device list", async () => {
    const response = await request(app)
      .get("/dossiers/1")
      .set("authorization", "Bearer admin");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("deviceList");
    expect(response.body.deviceList).toHaveLength(1);
    expect(response.body.deviceList[0]).toHaveProperty("id", 1);
    expect(response.body.deviceList[0]).toHaveProperty("name", "Test Device");
  });

  it("Should return the csm", async () => {
    const response = await request(app)
      .get("/dossiers/1")
      .set("authorization", "Bearer admin");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("csm");
    expect(response.body.csm).toHaveProperty("id", 1);
    expect(response.body.csm).toHaveProperty("name", "Test CSM");
  });
  it("Should return the customer", async () => {
    const response = await request(app)
      .get("/dossiers/1")
      .set("authorization", "Bearer admin");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("customer");
    expect(response.body.customer).toHaveProperty("id", 1);
    expect(response.body.customer).toHaveProperty("name", "Test Company");
  });

  it("Should return the roles", async () => {
    const response = await request(app)
      .get("/dossiers/1")
      .set("authorization", "Bearer admin");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("roles");
    expect(response.body.roles).toHaveLength(1);
    expect(response.body.roles[0]).toHaveProperty("role");
    expect(response.body.roles[0].role).toHaveProperty("id", 1);
    expect(response.body.roles[0].role).toHaveProperty("name", "Test Role");
    expect(response.body.roles[0]).toHaveProperty("user");
    expect(response.body.roles[0].user).toHaveProperty("id", 2);
    expect(response.body.roles[0].user).toHaveProperty("name", "Test");
    expect(response.body.roles[0].user).toHaveProperty("surname", "PM");
  });
});
