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
      close_date: "2019-08-27T14:15:22Z",
      platform_id: 0,
      os: "1",
      page_manual_id: 0,
      page_preview_id: 0,
      pm_id: 1,
      customer_id: 0,
      desired_number_of_testers: 100,
      auto_apply: 1,
      auto_approve: 1,
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
    await tryber.tables.CustomRoles.do().delete();
    await tryber.tables.CampaignCustomRoles.do().delete();
    await tryber.tables.CampaignPhase.do().delete();
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
    expect(response.status).toBe(200);
  });

  it("Should answer 200 if user has access to the campaign", async () => {
    const response = await request(app)
      .get("/dossiers/1")
      .set("authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(200);
  });

  it("Should answer 200 if user has access to the campaign", async () => {
    const response = await request(app)
      .get("/dossiers/1")
      .set("authorization", 'Bearer tester olp {"appq_campaign":true}');
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
  it("Should return the close date", async () => {
    const response = await request(app)
      .get("/dossiers/1")
      .set("authorization", "Bearer admin");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("closeDate", "2019-08-27T14:15:22Z");
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

  it("Should return the phase", async () => {
    const response = await request(app)
      .get("/dossiers/1")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("phase");
    expect(response.body.phase).toHaveProperty("id", 1);
    expect(response.body.phase).toHaveProperty("name", "Active");
  });

  describe("Campaign Plan", () => {
    beforeEach(async () => {
      await tryber.tables.CpReqPlans.do().insert({
        id: 1,
        name: "Standard Plan",
        config: "config",
      });
      await tryber.tables.WpAppqEvdCampaign.do().insert({
        id: 2,
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
        customer_id: 0,
        desired_number_of_testers: 100,
        auto_apply: 1,
        plan_id: 1,
      });
    });
    afterEach(async () => {
      await tryber.tables.WpAppqEvdCampaign.do().delete().where("id", 2);
      await tryber.tables.CpReqPlans.do().delete();
    });
    it("Should return whether the campaign has a plan or not", async () => {
      const response = await request(app)
        .get("/dossiers/1")
        .set("authorization", "Bearer admin");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("hasPlan", false);

      const responseWithPlan = await request(app)
        .get("/dossiers/2")
        .set("authorization", "Bearer admin");
      expect(responseWithPlan.status).toBe(200);
      expect(responseWithPlan.body).toHaveProperty("hasPlan", true);
    });
  });

  describe("With dossier data", () => {
    beforeAll(async () => {
      await tryber.tables.CampaignDossierData.do().insert({
        id: 100,
        campaign_id: 1,
        description: "Original description",
        link: "Original link",
        goal: "Original goal",
        out_of_scope: "Original out of scope",
        target_audience: "Original target audience",
        target_size: 7,
        target_devices: "Original target devices",
        created_by: 100,
        updated_by: 100,
        product_type_id: 1,
        notes: "Notes",
        gender_quote: "gender quote: 100% female",
      });
      await tryber.tables.CampaignDossierDataCountries.do().insert([
        {
          campaign_dossier_data_id: 100,
          country_code: "IT",
        },
        {
          campaign_dossier_data_id: 100,
          country_code: "FR",
        },
      ]);

      await tryber.tables.WpAppqLang.do().insert([
        {
          id: 1,
          display_name: "English",
          lang_code: "en",
        },
        {
          id: 2,
          display_name: "Italiano",
          lang_code: "it",
        },
      ]);

      await tryber.tables.CampaignDossierDataLanguages.do().insert([
        {
          campaign_dossier_data_id: 100,
          language_id: 1,
          language_name: "English",
        },
        {
          campaign_dossier_data_id: 100,
          language_id: 2,
          language_name: "Arabic",
        },
      ]);

      await tryber.tables.Browsers.do().insert([
        {
          id: 1,
          name: "Chrome",
        },
        {
          id: 2,
          name: "Edge",
        },
      ]);

      await tryber.tables.CampaignDossierDataBrowsers.do().insert([
        {
          campaign_dossier_data_id: 100,
          browser_id: 1,
        },
        {
          campaign_dossier_data_id: 100,
          browser_id: 2,
        },
      ]);

      await tryber.tables.ProductTypes.do().insert([
        {
          id: 1,
          name: "Test Product",
        },
        {
          id: 2,
          name: "Another Product",
        },
      ]);
    });
    afterAll(async () => {
      await tryber.tables.CampaignDossierData.do().delete();
      await tryber.tables.CampaignDossierDataCountries.do().delete();
      await tryber.tables.WpAppqLang.do().delete();
      await tryber.tables.CampaignDossierDataLanguages.do().delete();
      await tryber.tables.Browsers.do().delete();
      await tryber.tables.CampaignDossierDataBrowsers.do().delete();
      await tryber.tables.ProductTypes.do().delete();
    });

    it("Should return description", async () => {
      const response = await request(app)
        .get("/dossiers/1")
        .set("authorization", "Bearer admin");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "description",
        "Original description"
      );
    });

    it("Should return link", async () => {
      const response = await request(app)
        .get("/dossiers/1")
        .set("authorization", "Bearer admin");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("productLink", "Original link");
    });

    it("Should return goal", async () => {
      const response = await request(app)
        .get("/dossiers/1")
        .set("authorization", "Bearer admin");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("goal", "Original goal");
    });

    it("Should return out of scope", async () => {
      const response = await request(app)
        .get("/dossiers/1")
        .set("authorization", "Bearer admin");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "outOfScope",
        "Original out of scope"
      );
    });

    it("Should return target audience", async () => {
      const response = await request(app)
        .get("/dossiers/1")
        .set("authorization", "Bearer admin");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "target",
        expect.objectContaining({ notes: "Original target audience" })
      );
    });

    it("Should return target size", async () => {
      const response = await request(app)
        .get("/dossiers/1")
        .set("authorization", "Bearer admin");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("target");
      expect(response.body.target).toHaveProperty("size", 7);
    });

    it("Should return devices requirements", async () => {
      const response = await request(app)
        .get("/dossiers/1")
        .set("authorization", "Bearer admin");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "deviceRequirements",
        "Original target devices"
      );
    });

    it("Should return countries", async () => {
      const response = await request(app)
        .get("/dossiers/1")
        .set("authorization", "Bearer admin");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("countries");
      expect(response.body.countries).toHaveLength(2);
      expect(response.body.countries).toContainEqual("IT");
      expect(response.body.countries).toContainEqual("FR");
    });

    it("Should return languages", async () => {
      const response = await request(app)
        .get("/dossiers/1")
        .set("authorization", "Bearer admin");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("languages");
      expect(response.body.languages).toHaveLength(2);
      expect(response.body.languages).toEqual(
        expect.arrayContaining([
          { name: "English" },
          {
            name: "Arabic",
          },
        ])
      );
    });
    it("Should return browsers", async () => {
      const response = await request(app)
        .get("/dossiers/1")
        .set("authorization", "Bearer admin");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("browsers");
      expect(response.body.browsers).toHaveLength(2);
      expect(response.body.browsers).toEqual(
        expect.arrayContaining([
          { id: 1, name: "Chrome" },
          {
            id: 2,
            name: "Edge",
          },
        ])
      );
    });
    it("Should return product type", async () => {
      const response = await request(app)
        .get("/dossiers/1")
        .set("authorization", "Bearer admin");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("productType");
      expect(response.body.productType).toHaveProperty("id", 1);
      expect(response.body.productType).toHaveProperty("name", "Test Product");
    });

    it("Should return notes", async () => {
      const response = await request(app)
        .get("/dossiers/1")
        .set("authorization", "Bearer admin");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("notes", "Notes");
    });
    it("Should return genderQuote", async () => {
      const response = await request(app)
        .get("/dossiers/1")
        .set("authorization", "Bearer admin");

      expect(response.status).toBe(200);
      expect(response.body.target).toHaveProperty(
        "genderQuote",
        "gender quote: 100% female"
      );
    });

    it("Should return id", async () => {
      const response = await request(app)
        .get("/dossiers/1")
        .set("authorization", "Bearer admin");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", 1);
    });
    describe("With visibility criteria - Age", () => {
      beforeAll(async () => {
        await tryber.tables.CampaignDossierDataAge.do().insert([
          {
            campaign_dossier_data_id: 100,
            min: 18,
            max: 35,
          },
          {
            campaign_dossier_data_id: 100,
            min: 36,
            max: 50,
          },
        ]);
      });

      afterAll(async () => {
        await tryber.tables.CampaignDossierDataAge.do().delete();
      });

      it("Should return age visibility criteria age", async () => {
        const response = await request(app)
          .get("/dossiers/1")
          .set("authorization", "Bearer admin");

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("visibilityCriteria");
        expect(response.body.visibilityCriteria).toHaveProperty("ageRanges", [
          { min: 18, max: 35 },
          { min: 36, max: 50 },
        ]);
      });
    });
    describe("With visibility criteria - Gender", () => {
      beforeAll(async () => {
        await tryber.tables.CampaignDossierDataGender.do().insert([
          {
            campaign_dossier_data_id: 100,
            gender: 1, // 1 for male
          },
          {
            campaign_dossier_data_id: 100,
            gender: 0, // 2 for female
          },
        ]);
      });
      afterAll(async () => {
        await tryber.tables.CampaignDossierDataGender.do().delete();
      });
      it("Should return age visibility criteria gender", async () => {
        const response = await request(app)
          .get("/dossiers/1")
          .set("authorization", "Bearer admin");
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("visibilityCriteria");
        expect(response.body.visibilityCriteria).toHaveProperty(
          "gender",
          [0, 1]
        );
      });
    });
    describe("With visibility criteria - Cuf", () => {
      beforeAll(async () => {
        await tryber.tables.CampaignDossierDataCuf.do().insert([
          {
            campaign_dossier_data_id: 100,
            cuf_id: 10,
            cuf_value_id: 110,
          },
          {
            campaign_dossier_data_id: 100,
            cuf_id: 10,
            cuf_value_id: 120,
          },
          {
            campaign_dossier_data_id: 100,
            cuf_id: 20,
            cuf_value_id: 210,
          },
        ]);
      });
      afterAll(async () => {
        await tryber.tables.CampaignDossierDataCuf.do().delete();
      });
      it("Should return age visibility criteria Cuf", async () => {
        const response = await request(app)
          .get("/dossiers/1")
          .set("authorization", "Bearer admin");

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("visibilityCriteria");
        expect(response.body.visibilityCriteria).toHaveProperty("cuf", [
          {
            cufId: 10,
            cufValueIds: [110, 120],
          },
          {
            cufId: 20,
            cufValueIds: [210],
          },
        ]);
      });
    });

    describe("With visibility criteria - Province", () => {
      beforeAll(async () => {
        await tryber.tables.CampaignDossierDataProvince.do().insert([
          {
            campaign_dossier_data_id: 100,
            province: "MI",
          },
          {
            campaign_dossier_data_id: 100,
            province: "PA",
          },
        ]);
      });
      afterAll(async () => {
        await tryber.tables.CampaignDossierDataProvince.do().delete();
      });
      it("Should return age visibility criteria Cuf", async () => {
        const response = await request(app)
          .get("/dossiers/1")
          .set("authorization", "Bearer admin");

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("visibilityCriteria");
        expect(response.body.visibilityCriteria).toHaveProperty("province", [
          "MI",
          "PA",
        ]);
      });
    });

    describe("Auto apply", () => {
      it("Should return autoApply value for the campaign", async () => {
        const response = await request(app)
          .get("/dossiers/1")
          .set("authorization", "Bearer admin");

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("autoApply", 1);
      });
    });
    describe("Auto approve", () => {
      it("Should return autoApprove value for the campaign", async () => {
        const response = await request(app)
          .get("/dossiers/1")
          .set("authorization", "Bearer admin");

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("autoApprove", 1);
      });
    });
  });
});
