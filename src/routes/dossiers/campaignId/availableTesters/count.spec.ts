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

  describe("Gender", () => {
    beforeAll(async () => {
      await tryber.tables.CampaignDossierDataGender.do().insert({
        campaign_dossier_data_id: 1,
        gender: 1,
      });

      const validTesterCount = 10;
      const invalidTesterCount = 5;

      const profile = {
        email: "test@example.com",
        employment_id: 1,
        education_id: 1,
        blacklisted: 0,
        name: "Tester",
      };

      await tryber.tables.WpAppqEvdProfile.do().insert(
        Array.from({ length: validTesterCount }, (_, i) => ({
          ...profile,
          id: i + 1,
          wp_user_id: i + 1,
          sex: 1,
        }))
      );

      await tryber.tables.WpAppqEvdProfile.do().insert(
        Array.from({ length: invalidTesterCount }, (_, i) => ({
          ...profile,
          id: i + validTesterCount + 1,
          wp_user_id: i + validTesterCount + 1,
          sex: 0,
        }))
      );
    });

    afterAll(async () => {
      await tryber.tables.CampaignDossierDataGender.do().delete();
      await tryber.tables.WpAppqEvdProfile.do().delete();
    });

    it("Should count tester with correct gender", async () => {
      const response = await request(app)
        .get("/dossiers/1/availableTesters")
        .set("authorization", "Bearer admin");
      expect(response.status).toBe(200);
      expect(response.body.count).toBe(10);
    });
  });

  describe("Country", () => {
    beforeAll(async () => {
      await tryber.tables.CampaignDossierDataCountries.do().insert({
        campaign_dossier_data_id: 1,
        country_code: "IT",
      });

      const validTesterCount = 10;
      const invalidTesterCount = 5;

      const profile = {
        email: "test@example.com",
        employment_id: 1,
        education_id: 1,
        blacklisted: 0,
        name: "Tester",
      };

      await tryber.tables.WpAppqEvdProfile.do().insert(
        Array.from({ length: validTesterCount }, (_, i) => ({
          ...profile,
          id: i + 1,
          wp_user_id: i + 1,
          country: "Italy",
        }))
      );

      await tryber.tables.WpAppqEvdProfile.do().insert(
        Array.from({ length: invalidTesterCount }, (_, i) => ({
          ...profile,
          id: i + validTesterCount + 1,
          wp_user_id: i + validTesterCount + 1,
          country: "France",
        }))
      );
    });

    afterAll(async () => {
      await tryber.tables.CampaignDossierDataCountries.do().delete();
      await tryber.tables.WpAppqEvdProfile.do().delete();
    });

    it("Should count tester with correct country", async () => {
      const response = await request(app)
        .get("/dossiers/1/availableTesters")
        .set("authorization", "Bearer admin");
      expect(response.status).toBe(200);
      expect(response.body.count).toBe(10);
    });
  });

  describe("Provinces", () => {
    beforeAll(async () => {
      await tryber.tables.CampaignDossierDataProvince.do().insert({
        campaign_dossier_data_id: 1,
        province: "MI",
      });

      const validTesterCount = 10;
      const invalidTesterCount = 5;

      const profile = {
        email: "test@example.com",
        employment_id: 1,
        education_id: 1,
        blacklisted: 0,
        name: "Tester",
      };

      await tryber.tables.WpAppqEvdProfile.do().insert(
        Array.from({ length: validTesterCount }, (_, i) => ({
          ...profile,
          id: i + 1,
          wp_user_id: i + 1,
          province: "MI",
        }))
      );

      await tryber.tables.WpAppqEvdProfile.do().insert(
        Array.from({ length: invalidTesterCount }, (_, i) => ({
          ...profile,
          id: i + validTesterCount + 1,
          wp_user_id: i + validTesterCount + 1,
          province: "TO",
        }))
      );
    });

    afterAll(async () => {
      await tryber.tables.CampaignDossierDataProvince.do().delete();
      await tryber.tables.WpAppqEvdProfile.do().delete();
    });
    it("Should count tester with correct province", async () => {
      const response = await request(app)
        .get("/dossiers/1/availableTesters")
        .set("authorization", "Bearer admin");
      expect(response.status).toBe(200);
      expect(response.body.count).toBe(10);
    });
  });
  describe("Age", () => {
    beforeAll(async () => {
      await tryber.tables.CampaignDossierDataAge.do().insert([
        {
          campaign_dossier_data_id: 1,
          min: 18,
          max: 20,
        },
        {
          campaign_dossier_data_id: 1,
          min: 22,
          max: 30,
        },
      ]);

      const validTesterCount = 10;
      const invalidTesterCount = 5;

      const profile = {
        email: "test@example.com",
        employment_id: 1,
        education_id: 1,
        blacklisted: 0,
        name: "Tester",
      };

      const nineteenYearsOld = new Date();
      nineteenYearsOld.setFullYear(nineteenYearsOld.getFullYear() - 19);
      const twentyThreeYearsOld = new Date();
      twentyThreeYearsOld.setFullYear(twentyThreeYearsOld.getFullYear() - 23);

      const fiftyYearsOld = new Date();
      fiftyYearsOld.setFullYear(fiftyYearsOld.getFullYear() - 50);

      await tryber.tables.WpAppqEvdProfile.do().insert(
        Array.from({ length: validTesterCount }, (_, i) => ({
          ...profile,
          id: i + 1,
          wp_user_id: i + 1,
          birth_date:
            i % 2 === 0
              ? nineteenYearsOld.toISOString().split("T")[0]
              : twentyThreeYearsOld.toISOString().split("T")[0],
        }))
      );

      await tryber.tables.WpAppqEvdProfile.do().insert(
        Array.from({ length: invalidTesterCount }, (_, i) => ({
          ...profile,
          id: i + validTesterCount + 1,
          wp_user_id: i + validTesterCount + 1,
          birth_date: fiftyYearsOld.toISOString().split("T")[0],
        }))
      );
    });

    afterAll(async () => {
      await tryber.tables.CampaignDossierDataAge.do().delete();
      await tryber.tables.WpAppqEvdProfile.do().delete();
    });
    it("Should count tester with correct province", async () => {
      const response = await request(app)
        .get("/dossiers/1/availableTesters")
        .set("authorization", "Bearer admin");
      console.log(response.body);
      expect(response.status).toBe(200);
      expect(response.body.count).toBe(10);
    });
  });

  describe("Languages", () => {
    beforeAll(async () => {
      await tryber.tables.CampaignDossierDataLanguages.do().insert([
        {
          campaign_dossier_data_id: 1,
          language_id: 0,
          language_name: "Italian",
        },
      ]);

      const validTesterCount = 10;
      const invalidTesterCount = 5;

      const profile = {
        email: "test@example.com",
        employment_id: 1,
        education_id: 1,
        blacklisted: 0,
        name: "Tester",
      };

      for (let i = 0; i < validTesterCount; i++) {
        await tryber.tables.WpAppqEvdProfile.do().insert({
          ...profile,
          id: i + 1,
          wp_user_id: i + 1,
        });

        await tryber.tables.WpAppqProfileHasLang.do().insert({
          profile_id: i + 1,
          language_id: 1, // Assuming language_id 1 is valid
          language_name: "Italian",
        });
      }

      for (let i = 0; i < invalidTesterCount; i++) {
        await tryber.tables.WpAppqEvdProfile.do().insert({
          ...profile,
          id: i + validTesterCount + 1,
          wp_user_id: i + validTesterCount + 1,
        });

        await tryber.tables.WpAppqProfileHasLang.do().insert({
          profile_id: i + validTesterCount + 1,
          language_id: 2, // Assuming language_id 2 is invalid
          language_name: "English",
        });
      }
    });

    afterAll(async () => {
      await tryber.tables.CampaignDossierDataLanguages.do().delete();
      await tryber.tables.WpAppqEvdProfile.do().delete();
      await tryber.tables.WpAppqProfileHasLang.do().delete();
    });
    it("Should count tester with correct language", async () => {
      const response = await request(app)
        .get("/dossiers/1/availableTesters")
        .set("authorization", "Bearer admin");
      expect(response.status).toBe(200);
      expect(response.body.count).toBe(10);
    });
  });

  describe("CUF", () => {
    beforeAll(async () => {
      await tryber.tables.CampaignDossierDataCuf.do().insert([
        {
          campaign_dossier_data_id: 1,
          cuf_id: 1,
          cuf_value_id: 10,
        },
      ]);

      const validTesterCount = 10;
      const invalidTesterCount = 5;

      const profile = {
        email: "test@example.com",
        employment_id: 1,
        education_id: 1,
        blacklisted: 0,
        name: "Tester",
      };

      await tryber.tables.WpAppqCustomUserField.do().insert({
        id: 1,
        name: "Test CUF",
        slug: "test_cuf",
        placeholder: "Select an option",
        type: "select",
        extras: "",
        custom_user_field_group_id: 0,
      });
      await tryber.tables.WpAppqCustomUserFieldExtras.do().insert([
        {
          id: 10,
          name: "Option 1",
          custom_user_field_id: 1,
        },
        {
          id: 20,
          name: "Option 2",
          custom_user_field_id: 1,
        },
      ]);

      for (let i = 0; i < validTesterCount; i++) {
        await tryber.tables.WpAppqEvdProfile.do().insert({
          ...profile,
          id: i + 1,
          wp_user_id: i + 1,
        });

        await tryber.tables.WpAppqCustomUserFieldData.do().insert({
          profile_id: i + 1,
          custom_user_field_id: 1,
          value: "10",
          candidate: 0,
        });
      }

      for (let i = 0; i < invalidTesterCount; i++) {
        await tryber.tables.WpAppqEvdProfile.do().insert({
          ...profile,
          id: i + validTesterCount + 1,
          wp_user_id: i + validTesterCount + 1,
        });

        await tryber.tables.WpAppqCustomUserFieldData.do().insert({
          profile_id: i + 1,
          custom_user_field_id: 1,
          value: "20",
          candidate: 0,
        });
      }
    });

    afterAll(async () => {
      await tryber.tables.CampaignDossierDataProvince.do().delete();
      await tryber.tables.WpAppqEvdProfile.do().delete();
      await tryber.tables.WpAppqCustomUserField.do().delete();
      await tryber.tables.WpAppqCustomUserFieldExtras.do().delete();
      await tryber.tables.WpAppqCustomUserFieldData.do().delete();
    });
    it("Should count tester with correct cuf", async () => {
      const response = await request(app)
        .get("/dossiers/1/availableTesters")
        .set("authorization", "Bearer admin");
      expect(response.status).toBe(200);
      expect(response.body.count).toBe(10);
    });
  });
});
