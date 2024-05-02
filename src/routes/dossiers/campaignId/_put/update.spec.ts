import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

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
    await tryber.tables.CampaignPhase.do().insert({
      id: 1,
      name: "Draft",
      type_id: 1,
    });
    await tryber.tables.WpAppqCustomer.do().insert({
      id: 1,
      company: "Test Company",
      pm_id: 1,
    });
    await tryber.tables.WpAppqProject.do().insert([
      {
        id: 10,
        display_name: "Test Project",
        customer_id: 1,
        edited_by: 1,
      },
      {
        id: 11,
        display_name: "Test Project 11",
        customer_id: 1,
        edited_by: 1,
      },
    ]);

    await tryber.tables.WpAppqCampaignType.do().insert([
      {
        id: 10,
        name: "Test Type",
        description: "Test Description",
        category_id: 1,
      },
      {
        id: 11,
        name: "Test Type",
        description: "Test Description",
        category_id: 1,
      },
    ]);

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

    await tryber.tables.WpAppqEvdProfile.do().insert({
      id: 1,
      wp_user_id: 1,
      name: "Test User",
      email: "",
      education_id: 1,
      employment_id: 1,
    });

    await tryber.tables.WpAppqLang.do().insert([
      { id: 1, display_name: "Test Language", lang_code: "TL" },
      { id: 2, display_name: "Other Language", lang_code: "OL" },
    ]);

    await tryber.tables.Browsers.do().insert([
      { id: 1, name: "Test Browser" },
      { id: 2, name: "Other Browser" },
    ]);

    await tryber.tables.ProductTypes.do().insert([
      { id: 1, name: "Test Product" },
      { id: 2, name: "Other Product" },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.WpAppqCustomer.do().delete();
    await tryber.tables.WpAppqProject.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpAppqLang.do().delete();
    await tryber.tables.Browsers.do().delete();
    await tryber.tables.ProductTypes.do().delete();
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
      close_date: "2019-08-25T14:15:22Z",
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
    await tryber.tables.CampaignDossierData.do().delete();
    await tryber.tables.CampaignDossierDataCountries.do().delete();
    await tryber.tables.CampaignDossierDataLanguages.do().delete();
    await tryber.tables.CampaignDossierDataBrowsers.do().delete();
  });

  it("Should update the campaign to be linked to the specified project", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, project: 11 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("project_id", 11);
  });

  it("Should updte the campaign to be linked to the specified test type", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, testType: 11 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("campaign_type_id", 11);
  });

  it("Should update the campaign with the specified title", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        title: { ...baseRequest.title, tester: "new title" },
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("title", "new title");
  });

  it("Should update the campaign with the specified customer title", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        title: { ...baseRequest.title, customer: "new title" },
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("customer_title", "new title");
  });

  it("Should update the campaign with the specified start date", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        startDate: "2021-08-24T14:15:22Z",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("start_date", "2021-08-24T14:15:22Z");
  });

  it("Should update the campaign with the specified end date ", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        endDate: "2021-08-20T14:15:22Z",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("end_date", "2021-08-20T14:15:22Z");
  });

  it("Should update the campaign with the specified close date ", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        closeDate: "2021-08-20T14:15:22Z",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("close_date", "2021-08-20T14:15:22Z");
  });

  it("Should leave the end date of the campaign unedited if left unspecified", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        startDate: "2021-08-20T14:15:22Z",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("end_date", "2019-08-24T14:15:22Z");
  });

  it("Should leave the close date of the campaign unedited if left unspecified", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        startDate: "2021-08-20T14:15:22Z",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("close_date", "2019-08-25T14:15:22Z");
  });

  it("Should update the campaign with current user as pm_id", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send(baseRequest);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("pm_id", 1);
  });

  it("Should update campaign with the specified device list", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, deviceList: [1, 2] });

    expect(response.status).toBe(200);

    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("os", "1,2");
    expect(campaign).toHaveProperty("form_factor", "0,1");
  });

  describe("Without dossier data", () => {
    it("Should create dossier data for the campaign", async () => {
      const response = await request(app)
        .put("/dossiers/1")
        .set("authorization", "Bearer admin")
        .send({ ...baseRequest, description: "Test description" });

      expect(response.status).toBe(200);

      const dossierData = await tryber.tables.CampaignDossierData.do()
        .select()
        .where({ campaign_id: 1 });
      expect(dossierData).toHaveLength(1);
      expect(dossierData[0]).toHaveProperty("description", "Test description");
    });
  });

  describe("With dossier data", () => {
    beforeEach(async () => {
      await tryber.tables.CampaignDossierData.do().insert({
        id: 1,
        campaign_id: 1,
        description: "Original description",
        link: "Original link",
        goal: "Original goal",
        out_of_scope: "Original out of scope",
        target_audience: "Original target audience",
        target_size: 0,
        target_devices: "Original target devices",
        product_type_id: 2,
        created_by: 100,
        updated_by: 100,
      });

      await tryber.tables.CampaignDossierDataCountries.do().insert([
        { campaign_dossier_data_id: 1, country_code: "US" },
        { campaign_dossier_data_id: 1, country_code: "GB" },
      ]);

      await tryber.tables.CampaignDossierDataLanguages.do().insert([
        { campaign_dossier_data_id: 1, language_id: 2 },
      ]);
      await tryber.tables.CampaignDossierDataBrowsers.do().insert([
        { campaign_dossier_data_id: 1, browser_id: 2 },
      ]);
    });

    it("Should save description in the dossier data", async () => {
      const response = await request(app)
        .put("/dossiers/1")
        .set("authorization", "Bearer admin")
        .send({ ...baseRequest, description: "Test description" });

      expect(response.status).toBe(200);
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
        .put("/dossiers/1")
        .set("authorization", "Bearer admin")
        .send({ ...baseRequest, productLink: "https://example.com" });

      expect(response.status).toBe(200);
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
        .put("/dossiers/1")
        .set("authorization", "Bearer admin")
        .send({ ...baseRequest, goal: "Having no bugs" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");

      const id = 1;

      const dossierData = await tryber.tables.CampaignDossierData.do()
        .select()
        .where({ campaign_id: id });
      expect(dossierData).toHaveLength(1);
      expect(dossierData[0]).toHaveProperty("goal", "Having no bugs");
    });

    it("Should save outOfScope in the dossier data", async () => {
      const response = await request(app)
        .put("/dossiers/1")
        .set("authorization", "Bearer admin")
        .send({ ...baseRequest, outOfScope: "Login page" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");

      const id = 1;

      const dossierData = await tryber.tables.CampaignDossierData.do()
        .select()
        .where({ campaign_id: id });
      expect(dossierData).toHaveLength(1);
      expect(dossierData[0]).toHaveProperty("out_of_scope", "Login page");
    });

    it("Should save target notes in the dossier data", async () => {
      const response = await request(app)
        .put("/dossiers/1")
        .set("authorization", "Bearer admin")
        .send({ ...baseRequest, target: { notes: "New testers" } });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");

      const id = 1;

      const dossierData = await tryber.tables.CampaignDossierData.do()
        .select()
        .where({ campaign_id: id });
      expect(dossierData).toHaveLength(1);
      expect(dossierData[0]).toHaveProperty("target_audience", "New testers");
    });

    it("Should save device requirements in the dossier data", async () => {
      const response = await request(app)
        .put("/dossiers/1")
        .set("authorization", "Bearer admin")
        .send({ ...baseRequest, deviceRequirements: "New devices" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");

      const id = 1;

      const dossierData = await tryber.tables.CampaignDossierData.do()
        .select()
        .where({ campaign_id: id });
      expect(dossierData).toHaveLength(1);
      expect(dossierData[0]).toHaveProperty("target_devices", "New devices");
    });

    it("Should save target size in the dossier data", async () => {
      const response = await request(app)
        .put("/dossiers/1")
        .set("authorization", "Bearer admin")
        .send({ ...baseRequest, target: { size: 10 } });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");

      const id = 1;

      const dossierData = await tryber.tables.CampaignDossierData.do()
        .select()
        .where({ campaign_id: id });
      expect(dossierData).toHaveLength(1);
      expect(dossierData[0]).toHaveProperty("target_size", 10);
    });

    it("Should save the tester id in the dossier data", async () => {
      const response = await request(app)
        .put("/dossiers/1")
        .set("authorization", "Bearer admin")
        .send(baseRequest);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");

      const id = 1;

      const dossierData = await tryber.tables.CampaignDossierData.do()
        .select()
        .where({ campaign_id: id });
      expect(dossierData).toHaveLength(1);
      expect(dossierData[0]).toHaveProperty("created_by", 100);
      expect(dossierData[0]).toHaveProperty("updated_by", 1);
    });

    it("Should update the countries in the dossier data", async () => {
      const response = await request(app)
        .put("/dossiers/1")
        .set("authorization", "Bearer admin")
        .send({
          ...baseRequest,
          countries: ["DE", "FR"],
        });

      const responseGet = await request(app)
        .get("/dossiers/1")
        .set("authorization", "Bearer admin");
      console.log(responseGet.body);
      expect(responseGet.status).toBe(200);
      expect(responseGet.body).toHaveProperty("countries", ["DE", "FR"]);
    });
    it("Should update the languages in the dossier data", async () => {
      await request(app)
        .put("/dossiers/1")
        .set("authorization", "Bearer admin")
        .send({
          ...baseRequest,
          languages: [1],
        });

      const responseGet = await request(app)
        .get("/dossiers/1")
        .set("authorization", "Bearer admin");
      console.log(responseGet.body);
      expect(responseGet.status).toBe(200);
      expect(responseGet.body).toHaveProperty("languages");
      expect(responseGet.body.languages).toHaveLength(1);
      expect(responseGet.body.languages[0]).toEqual({
        id: 1,
        name: "Test Language",
      });
    });

    it("Should update the browsers in the dossier data", async () => {
      await request(app)
        .put("/dossiers/1")
        .set("authorization", "Bearer admin")
        .send({
          ...baseRequest,
          browsers: [1],
        });

      const responseGet = await request(app)
        .get("/dossiers/1")
        .set("authorization", "Bearer admin");
      expect(responseGet.status).toBe(200);
      expect(responseGet.body).toHaveProperty("browsers");
      expect(responseGet.body.browsers).toHaveLength(1);
      expect(responseGet.body.browsers[0]).toEqual({
        id: 1,
        name: "Test Browser",
      });
    });
    it("Should update the product type in the dossier data", async () => {
      await request(app)
        .put("/dossiers/1")
        .set("authorization", "Bearer admin")
        .send({
          ...baseRequest,
          productType: 1,
        });

      const responseGet = await request(app)
        .get("/dossiers/1")
        .set("authorization", "Bearer admin");
      expect(responseGet.status).toBe(200);
      expect(responseGet.body).toHaveProperty("productType");
      expect(responseGet.body.productType).toEqual({
        id: 1,
        name: "Test Product",
      });
    });
  });

  describe("Role handling", () => {
    beforeAll(async () => {
      await tryber.tables.WpAppqEvdProfile.do().insert({
        id: 2,
        wp_user_id: 2,
        name: "Test User",
        surname: "Test Surname",
        education_id: 1,
        employment_id: 1,
        email: "",
      });

      await tryber.tables.CustomRoles.do().insert([
        {
          id: 1,
          name: "Test Role",
          olp: '["appq_bugs"]',
        },
        {
          id: 2,
          name: "Another Role",
          olp: '["appq_bugs_2"]',
        },
      ]);
    });
    afterAll(async () => {
      await tryber.tables.WpAppqEvdProfile.do().delete();
      await tryber.tables.CustomRoles.do().delete();
      await tryber.tables.WpAppqEvdProfile.do().delete();
    });
    afterEach(async () => {
      await tryber.tables.CampaignCustomRoles.do().delete();
      await tryber.tables.WpAppqOlpPermissions.do().delete();
    });
    describe("When campaign has no roles", () => {
      it("Should link the roles to the campaign", async () => {
        const response = await request(app)
          .put("/dossiers/1")
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
          .put("/dossiers/1")
          .set("authorization", "Bearer admin")
          .send({ ...baseRequest, roles: [{ role: 1, user: 2 }] });

        const olps = await tryber.tables.WpAppqOlpPermissions.do()
          .select()
          .where({ main_id: 1 });
        expect(olps).toHaveLength(1);
        expect(olps[0]).toHaveProperty("type", "appq_bugs");
        expect(olps[0]).toHaveProperty("main_type", "campaign");
        expect(olps[0]).toHaveProperty("wp_user_id", 2);
      });
    });

    describe("When campaign has roles", () => {
      beforeEach(async () => {
        await tryber.tables.CampaignCustomRoles.do().insert([
          {
            campaign_id: 1,
            custom_role_id: 1,
            tester_id: 2,
          },
        ]);
        await tryber.tables.WpAppqOlpPermissions.do().insert([
          {
            main_id: 1,
            main_type: "campaign",
            type: "appq_bugs",
            wp_user_id: 2,
          },
        ]);
      });

      afterEach(async () => {
        await tryber.tables.CampaignCustomRoles.do().delete();
        await tryber.tables.WpAppqOlpPermissions.do().delete();
      });
      it("Should link the roles to the campaign", async () => {
        const response = await request(app)
          .put("/dossiers/1")
          .set("authorization", "Bearer admin")
          .send({ ...baseRequest, roles: [{ role: 2, user: 2 }] });

        const id = response.body.id;

        const roles = await tryber.tables.CampaignCustomRoles.do()
          .select()
          .where({ campaign_id: id });
        expect(roles).toHaveLength(1);
        expect(roles[0]).toHaveProperty("custom_role_id", 2);
        expect(roles[0]).toHaveProperty("tester_id", 2);
      });

      it("Should set the olp roles to the campaign", async () => {
        const response = await request(app)
          .put("/dossiers/1")
          .set("authorization", "Bearer admin")
          .send({ ...baseRequest, roles: [{ role: 2, user: 2 }] });

        const olps = await tryber.tables.WpAppqOlpPermissions.do()
          .select()
          .where({ main_id: 1 });
        expect(olps).toHaveLength(1);
        expect(olps[0]).toHaveProperty("type", "appq_bugs_2");
        expect(olps[0]).toHaveProperty("main_type", "campaign");
        expect(olps[0]).toHaveProperty("wp_user_id", 2);
      });
    });
  });
});
