import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

jest.mock("@src/features/wp/WordpressJsonApiTrigger");
jest.mock("@src/features/webhookTrigger");
const baseRequest = {
  project: 10,
  testType: 10,
  title: {
    customer: "Campaign Title for Customer",
    tester: "Campaign Title for Tester",
  },
  startDate: "2019-08-24T14:15:22Z",
  deviceList: [1],
};

describe("Route POST /dossiers", () => {
  beforeAll(async () => {
    await tryber.seeds().bug_types();
    await tryber.tables.CampaignPhase.do().insert([
      { id: 1, name: "Test Phase", type_id: 1 },
    ]);
    await tryber.tables.WpAppqEvdProfile.do().insert({
      id: 1,
      wp_user_id: 100,
      name: "",
      email: "",
      education_id: 1,
      employment_id: 1,
    });
    await tryber.tables.WpAppqCustomer.do().insert({
      id: 1,
      company: "Test Company",
      pm_id: 1,
    });
    await tryber.tables.WpAppqProject.do().insert({
      id: 10,
      display_name: "Test Project",
      customer_id: 1,
      edited_by: 1,
    });

    await tryber.tables.WpAppqCampaignType.do().insert({
      id: 10,
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
      {
        id: 2,
        name: "Test Type",
        form_factor: 1,
        architecture: 1,
      },
    ]);

    await tryber.tables.CustomRoles.do().insert([
      { id: 1, name: "Test Role", olp: '["appq_bugs"]' },
    ]);

    await tryber.tables.ProductTypes.do().insert([
      {
        id: 1,
        name: "App",
      },
      {
        id: 2,
        name: "Web",
      },
    ]);

    await tryber.tables.Browsers.do().insert([
      {
        id: 1,
        name: "Test Browser",
      },
      {
        id: 2,
        name: "Other Browser",
      },
    ]);

    /* await tryber.tables.WpAppqLang.do().insert([
      {
        id: 1,
        display_name: "Test Language",
        lang_code: "te-ST",
      },
    ]);*/
  });

  afterAll(async () => {
    await tryber.tables.CampaignPhase.do().delete();
    await tryber.tables.WpAppqCustomer.do().delete();
    await tryber.tables.WpAppqProject.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.CustomRoles.do().delete();
    await tryber.tables.ProductTypes.do().delete();
    await tryber.tables.Browsers.do().delete();
    await tryber.tables.WpAppqLang.do().delete();
  });
  afterEach(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.CampaignCustomRoles.do().delete();
    await tryber.tables.CampaignDossierData.do().delete();
    await tryber.tables.CampaignDossierDataBrowsers.do().delete();
    await tryber.tables.CampaignDossierDataLanguages.do().delete();
    await tryber.tables.CampaignDossierDataCountries.do().delete();
    await tryber.tables.WpAppqCampaignAdditionalFields.do().delete();
  });

  it("Should create a campaign", async () => {
    const postResponse = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send(baseRequest);

    expect(postResponse.status).toBe(201);
    expect(postResponse.body).toHaveProperty("id");

    const getResponse = await request(app)
      .get(`/campaigns/${postResponse.body.id}`)
      .set("authorization", "Bearer admin");

    expect(getResponse.status).toBe(200);
  });

  it("Should create a campaign linked to the specified project", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, project: 10 });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("project_id", 10);
  });

  it("Should create a campaign linked to the specified test type", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, testType: 10 });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("campaign_type_id", 10);
  });

  it("Should create a campaign with the specified title", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        title: { ...baseRequest.title, tester: "new title" },
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("title", "new title");
  });
  it("Should create a campaign with the specified customer title", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        title: { ...baseRequest.title, customer: "new title" },
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("customer_title", "new title");
  });

  it("Should create a campaign with the specified start date", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        startDate: "2021-08-24T14:15:22Z",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("start_date", "2021-08-24 14:15:22");
  });

  it("Should create a campaign with the specified end date ", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        endDate: "2021-08-20T14:15:22Z",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("end_date", "2021-08-20 14:15:22");
  });

  it("Should create a campaign with the specified close date ", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        closeDate: "2021-08-20T14:15:22Z",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("close_date", "2021-08-20 14:15:22");
  });

  it("Should create a campaign with the specified additional fields", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        additionals: [
          {
            name: "Regex Field",
            slug: "regex-field",
            error: "Regex error",
            type: "text",
            regex: "^[a-zA-Z0-9]+$",
          },
          {
            name: "Select Field",
            slug: "select-field",
            error: "Select error",
            type: "select",
            showInStats: true,
            options: ["Option 1", "Option 2"],
          },
        ],
      });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const fields = await tryber.tables.WpAppqCampaignAdditionalFields.do()
      .select()
      .where("cp_id", id);

    expect(fields).toHaveLength(2);
    expect(fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cp_id: id,
          title: "Regex Field",
          slug: "regex-field",
          type: "regex",
          validation: "^[a-zA-Z0-9]+$",
          error_message: "Regex error",
          stats: 0,
        }),
        expect.objectContaining({
          cp_id: id,
          title: "Select Field",
          slug: "select-field",
          type: "select",
          validation: "Option 1;Option 2",
          error_message: "Select error",
          stats: 1,
        }),
      ])
    );
  });

  it("Should create a campaign with the specified bug types", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        bugTypes: [1, 2, 3],
      });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const bugTypes = await tryber.tables.WpAppqAdditionalBugTypes.do()
      .select()
      .where("campaign_id", id);

    expect(bugTypes).toHaveLength(3);
    expect(bugTypes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          bug_type_id: 1,
        }),
        expect.objectContaining({
          bug_type_id: 2,
        }),
        expect.objectContaining({
          bug_type_id: 3,
        }),
      ])
    );
  });

  it("Should create a campaign with default bug types if no specific bug types are selected", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
      });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const bugTypes = await tryber.tables.WpAppqAdditionalBugTypes.do()
      .select()
      .where("campaign_id", id);

    expect(bugTypes).toHaveLength(0);
  });

  it("Should throw an error if invalid bugtype is sent", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        bugTypes: [11111],
      });
    expect(response.status).toBe(406);
    expect(response.body).toHaveProperty("id");
  });

  it("Should create a campaign with the end date as start date + 7 if left unspecified", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        startDate: "2021-08-20T14:15:22Z",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("end_date", "2021-08-27 14:15:22");
  });

  it("Should create a campaign with the close date as start date + 14 if left unspecified", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        startDate: "2021-08-20T14:15:22Z",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("close_date", "2021-09-03 14:15:22");
  });

  it("Should create a campaign with current user as pm_id if left unspecified", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send(baseRequest);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("pm_id", 1);
  });

  it("Should create a campaign with current user as pm_id if specified", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, csm: 2 });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("pm_id", 2);
  });

  it("Should create a campaign with the specified device list", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, deviceList: [1, 2] });

    expect(response.status).toBe(201);

    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("os", "1,2");
    expect(campaign).toHaveProperty("form_factor", "0,1");
  });

  it("Should return 406 if adding a role that does not exist", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, roles: [{ role: 100, user: 1 }] });

    expect(response.status).toBe(406);
  });

  it("Should return 406 if adding a role to a user that does not exist", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, roles: [{ role: 1, user: 100 }] });

    expect(response.status).toBe(406);
  });

  it("Should link the roles to the campaign", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, roles: [{ role: 1, user: 1 }] });

    const id = response.body.id;

    const roles = await tryber.tables.CampaignCustomRoles.do()
      .select()
      .where({ campaign_id: id });
    expect(roles).toHaveLength(1);
    expect(roles[0]).toHaveProperty("custom_role_id", 1);
    expect(roles[0]).toHaveProperty("tester_id", 1);
  });

  it("Should set the olp roles to the campaign", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, roles: [{ role: 1, user: 1 }] });

    const id = response.body.id;

    const olps = await tryber.tables.WpAppqOlpPermissions.do()
      .select()
      .where({ main_id: id });
    expect(olps).toHaveLength(1);
    expect(olps[0]).toHaveProperty("type", "appq_bugs");
    expect(olps[0]).toHaveProperty("main_type", "campaign");
    expect(olps[0]).toHaveProperty("wp_user_id", 100);
  });

  it("Should create a dossier data even if no additional data is provided", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send(baseRequest);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    const id = response.body.id;

    const dossierData = await tryber.tables.CampaignDossierData.do()
      .select()
      .where({ campaign_id: id });

    expect(dossierData).toHaveLength(1);
  });
  it("Should save description in the dossier data", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, description: "Test description" });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    const id = response.body.id;

    const dossierData = await tryber.tables.CampaignDossierData.do()
      .select()
      .where({ campaign_id: id });
    expect(dossierData).toHaveLength(1);
    expect(dossierData[0]).toHaveProperty("description", "Test description");
  });

  it("Should save productLink in the dossier data", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, productLink: "https://example.com" });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    const id = response.body.id;

    const dossierData = await tryber.tables.CampaignDossierData.do()
      .select()
      .where({ campaign_id: id });
    expect(dossierData).toHaveLength(1);
    expect(dossierData[0]).toHaveProperty("link", "https://example.com");
  });

  it("Should save goal in the dossier data", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, goal: "Having no bugs" });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    const id = response.body.id;

    const dossierData = await tryber.tables.CampaignDossierData.do()
      .select()
      .where({ campaign_id: id });
    expect(dossierData).toHaveLength(1);
    expect(dossierData[0]).toHaveProperty("goal", "Having no bugs");
  });

  it("Should save outOfScope in the dossier data", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, outOfScope: "Login page" });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    const id = response.body.id;

    const dossierData = await tryber.tables.CampaignDossierData.do()
      .select()
      .where({ campaign_id: id });
    expect(dossierData).toHaveLength(1);
    expect(dossierData[0]).toHaveProperty("out_of_scope", "Login page");
  });

  it("Should save target notes in the dossier data", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, target: { notes: "New testers" } });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    const id = response.body.id;

    const dossierData = await tryber.tables.CampaignDossierData.do()
      .select()
      .where({ campaign_id: id });
    expect(dossierData).toHaveLength(1);
    expect(dossierData[0]).toHaveProperty("target_audience", "New testers");
  });

  it("Should save device requirements in the dossier data", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, deviceRequirements: "New devices" });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    const id = response.body.id;

    const dossierData = await tryber.tables.CampaignDossierData.do()
      .select()
      .where({ campaign_id: id });
    expect(dossierData).toHaveLength(1);
    expect(dossierData[0]).toHaveProperty("target_devices", "New devices");
  });

  it("Should save target size in the dossier data", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, target: { size: 10 } });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    const id = response.body.id;

    const dossierData = await tryber.tables.CampaignDossierData.do()
      .select()
      .where({ campaign_id: id });
    expect(dossierData).toHaveLength(1);
    expect(dossierData[0]).toHaveProperty("target_size", 10);
  });
  it("Should save target size 0 in the dossier data", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, target: { size: 0 } });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    const id = response.body.id;

    const dossierData = await tryber.tables.CampaignDossierData.do()
      .select()
      .where({ campaign_id: id });
    expect(dossierData).toHaveLength(1);
    expect(dossierData[0]).toHaveProperty("target_size", 0);
  });

  it("Should save the tester id in the dossier data", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send(baseRequest);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    const id = response.body.id;

    const dossierData = await tryber.tables.CampaignDossierData.do()
      .select()
      .where({ campaign_id: id });
    expect(dossierData).toHaveLength(1);
    expect(dossierData[0]).toHaveProperty("created_by", 1);
    expect(dossierData[0]).toHaveProperty("updated_by", 1);
  });

  it("Should save the countries in the dossier data", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        countries: ["IT", "FR"],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    const id = response.body.id;

    const getResponse = await request(app)
      .get(`/dossiers/${id}`)
      .set("authorization", "Bearer admin");

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toHaveProperty("countries");
    expect(getResponse.body.countries).toHaveLength(2);
    expect(getResponse.body.countries).toContain("IT");
    expect(getResponse.body.countries).toContain("FR");
  });

  it("Should save the languages in the dossier data", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        languages: ["English"],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    const id = response.body.id;

    const getResponse = await request(app)
      .get(`/dossiers/${id}`)
      .set("authorization", "Bearer admin");

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toHaveProperty("languages");
    expect(getResponse.body.languages).toHaveLength(1);
    expect(getResponse.body.languages[0]).toEqual({
      name: "English",
    });
  });

  it("Should save the browsers in the dossier data", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        browsers: [1],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    const id = response.body.id;

    const getResponse = await request(app)
      .get(`/dossiers/${id}`)
      .set("authorization", "Bearer admin");

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toHaveProperty("browsers");
    expect(getResponse.body.browsers).toHaveLength(1);
    expect(getResponse.body.browsers[0]).toEqual({
      id: 1,
      name: "Test Browser",
    });
  });
  it("Should save the product type in the dossier data", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        productType: 1,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    const id = response.body.id;

    const getResponse = await request(app)
      .get(`/dossiers/${id}`)
      .set("authorization", "Bearer admin");

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toHaveProperty("productType");
    expect(getResponse.body.productType).toEqual({
      id: 1,
      name: "App",
    });
  });
  it("Should save the notes in the dossier data", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        notes: "Notes",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    const id = response.body.id;

    const getResponse = await request(app)
      .get(`/dossiers/${id}`)
      .set("authorization", "Bearer admin");

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toHaveProperty("notes", "Notes");
  });
  it("Should save the cap in the dossier data", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        target: {
          cap: 100,
        },
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    const id = response.body.id;

    const getResponse = await request(app)
      .get(`/dossiers/${id}`)
      .set("authorization", "Bearer admin");

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toHaveProperty("target");
    expect(getResponse.body.target).toHaveProperty("cap", 100);
  });
  it("Should save the cap 0 in the dossier data", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        target: {
          cap: 0,
        },
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    const id = response.body.id;

    const getResponse = await request(app)
      .get(`/dossiers/${id}`)
      .set("authorization", "Bearer admin");

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toHaveProperty("target");
    expect(getResponse.body.target).toHaveProperty("cap", 0);
  });
});
