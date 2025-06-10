import app from "@src/app";
import { tryber } from "@src/features/database";
import resolvePermalinks from "@src/features/wp/resolvePermalinks";
import request from "supertest";

jest.mock("@src/features/wp/resolvePermalinks");

const sevenDaysFromNow = new Date().setDate(new Date().getDate() + 7);
const endDate = new Date(sevenDaysFromNow).toISOString().split("T")[0];
const fourteenDaysFromNow = new Date().setDate(new Date().getDate() + 14);
const closeDate = new Date(fourteenDaysFromNow).toISOString().split("T")[0];

describe("GET /users/me/campaigns - target", () => {
  beforeAll(async () => {
    (resolvePermalinks as jest.Mock).mockImplementation(() => {
      return {
        1: { en: "en/test1", it: "it/test1", es: "es/test1", fr: "fr/test1" },
        2: { en: "en/test2", it: "it/test2", es: "es/test2", fr: "fr/test2" },
      };
    });
    await tryber.tables.WpAppqCampaignType.do().insert({
      id: 1,
      name: "Type",
      category_id: 1,
    });
    await tryber.seeds().campaign_statuses();
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      start_date: new Date().toISOString().split("T")[0],
      end_date: endDate,
      close_date: closeDate,
      campaign_type_id: 1,
      page_preview_id: 1,
      page_manual_id: 2,
      os: "1",
      platform_id: 1,
      pm_id: 1,
      customer_id: 1,
      project_id: 1,
      customer_title: "Customer",
      id: 1,
      title: "Public campaign",
      is_public: 4,
      phase_id: 20,
    });

    await tryber.tables.CampaignDossierData.do().insert({
      id: 1,
      campaign_id: 1,
      created_by: 1,
      link: "",
      updated_by: 1,
    });

    await tryber.tables.CampaignDossierDataLanguages.do().insert({
      campaign_dossier_data_id: 1,
      language_id: 1,
      language_name: "English",
    });

    await tryber.tables.CampaignDossierDataCountries.do().insert({
      campaign_dossier_data_id: 1,
      country_code: "IT",
    });
  });

  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.CampaignPhase.do().delete();
    jest.resetAllMocks();
  });

  describe("Tester in target", () => {
    beforeAll(async () => {
      await tryber.tables.WpAppqEvdProfile.do().insert({
        id: 1,
        wp_user_id: 1,
        email: "",
        education_id: 1,
        employment_id: 1,
        country: "Italy",
      });
      await tryber.tables.WpAppqProfileHasLang.do().insert({
        profile_id: 1,
        language_id: 1,
        language_name: "English",
      });
    });
    afterAll(async () => {
      await tryber.tables.WpAppqEvdProfile.do().delete();
      await tryber.tables.WpAppqProfileHasLang.do().delete();
    });
    it("Should show the campaign", async () => {
      const response = await request(app)
        .get("/users/me/campaigns")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("results");
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.results.length).toBe(1);
    });
  });
  describe("Tester partially in target", () => {
    beforeAll(async () => {
      await tryber.tables.WpAppqEvdProfile.do().insert({
        id: 1,
        wp_user_id: 1,
        email: "",
        education_id: 1,
        employment_id: 1,
        country: "Italy",
      });
      await tryber.tables.WpAppqProfileHasLang.do().insert({
        profile_id: 1,
        language_id: 2,
        language_name: "Arabic",
      });
    });
    afterAll(async () => {
      await tryber.tables.WpAppqEvdProfile.do().delete();
      await tryber.tables.WpAppqProfileHasLang.do().delete();
    });
    it("Should not show the campaign", async () => {
      const response = await request(app)
        .get("/users/me/campaigns")
        .set("Authorization", "Bearer tester");

      expect(response.status).toBe(404);
    });
  });
  describe("Tester not in target", () => {
    beforeAll(async () => {
      await tryber.tables.WpAppqEvdProfile.do().insert({
        id: 1,
        wp_user_id: 1,
        email: "",
        education_id: 1,
        employment_id: 1,
        country: "France",
      });
      await tryber.tables.WpAppqProfileHasLang.do().insert({
        profile_id: 1,
        language_id: 2,
        language_name: "Afrikaans",
      });
    });
    afterAll(async () => {
      await tryber.tables.WpAppqEvdProfile.do().delete();
      await tryber.tables.WpAppqProfileHasLang.do().delete();
    });
    it("Should show the campaign", async () => {
      const response = await request(app)
        .get("/users/me/campaigns")
        .set("Authorization", "Bearer tester");

      expect(response.status).toBe(404);
    });
  });

  describe("Target by CUF", () => {
    beforeAll(async () => {
      await tryber.tables.CampaignDossierDataCuf.do().insert({
        campaign_dossier_data_id: 1,
        cuf_id: 1,
        cuf_value_id: 1,
      });
      await tryber.tables.WpAppqCustomUserField.do().insert({
        id: 1,
        name: "CUF",
        type: "select",
        slug: "cuf",
        placeholder: "Select CUF",
        extras: "",
        custom_user_field_group_id: 0,
        enabled: 1,
        allow_other: 0,
        options: "",
      });
    });
    afterAll(async () => {
      await tryber.tables.CampaignDossierDataCuf.do().delete();
      await tryber.tables.WpAppqCustomUserField.do().delete();
    });

    describe("Tester with CUF", () => {
      beforeAll(async () => {
        await tryber.tables.WpAppqEvdProfile.do().insert({
          id: 1,
          wp_user_id: 1,
          email: "",
          education_id: 1,
          employment_id: 1,
          country: "Italy",
        });
        await tryber.tables.WpAppqProfileHasLang.do().insert({
          profile_id: 1,
          language_id: 1,
          language_name: "English",
        });
        await tryber.tables.WpAppqCustomUserFieldData.do().insert({
          custom_user_field_id: 1,
          profile_id: 1,
          value: "1",
          candidate: 0,
        });
      });
      afterAll(async () => {
        await tryber.tables.WpAppqEvdProfile.do().delete();
        await tryber.tables.WpAppqProfileHasLang.do().delete();
        await tryber.tables.WpAppqCustomUserFieldData.do().delete();
      });

      it("Should show the campaign", async () => {
        const response = await request(app)
          .get("/users/me/campaigns")
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(200);
      });
    });

    describe("Tester without CUF", () => {
      beforeAll(async () => {
        await tryber.tables.WpAppqEvdProfile.do().insert({
          id: 1,
          wp_user_id: 1,
          email: "",
          education_id: 1,
          employment_id: 1,
          country: "Italy",
        });
        await tryber.tables.WpAppqProfileHasLang.do().insert({
          profile_id: 1,
          language_id: 1,
          language_name: "English",
        });
      });
      afterAll(async () => {
        await tryber.tables.WpAppqEvdProfile.do().delete();
        await tryber.tables.WpAppqProfileHasLang.do().delete();
      });
      it("Should not show the campaign", async () => {
        const response = await request(app)
          .get("/users/me/campaigns")
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(404);
      });
    });

    describe("Tester with right age value", () => {
      beforeAll(async () => {
        await tryber.tables.WpAppqEvdProfile.do().insert({
          id: 1,
          wp_user_id: 1,
          email: "",
          education_id: 1,
          employment_id: 1,
          country: "Italy",
          birth_date: "2000-01-01",
        });
        await tryber.tables.WpAppqProfileHasLang.do().insert({
          profile_id: 1,
          language_id: 1,
          language_name: "English",
        });
        await tryber.tables.WpAppqCustomUserFieldData.do().insert({
          custom_user_field_id: 1,
          profile_id: 1,
          value: "1",
          candidate: 0,
        });
        await tryber.tables.CampaignDossierDataAge.do().insert({
          campaign_dossier_data_id: 1,
          max: 100,
          min: 23,
        });
      });
      afterAll(async () => {
        await tryber.tables.WpAppqEvdProfile.do().delete();
        await tryber.tables.CampaignDossierDataAge.do().delete();
        await tryber.tables.WpAppqProfileHasLang.do().delete();
        await tryber.tables.WpAppqCustomUserFieldData.do().delete();
      });

      it("Should show the campaign", async () => {
        const response = await request(app)
          .get("/users/me/campaigns")
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(200);
      });
    });

    describe("Tester with wrong age value", () => {
      beforeAll(async () => {
        await tryber.tables.WpAppqEvdProfile.do().insert({
          id: 1,
          wp_user_id: 1,
          email: "",
          education_id: 1,
          employment_id: 1,
          country: "Italy",
          birth_date: "2000-01-01",
        });
        await tryber.tables.WpAppqProfileHasLang.do().insert({
          profile_id: 1,
          language_id: 1,
          language_name: "English",
        });
        await tryber.tables.WpAppqCustomUserFieldData.do().insert({
          custom_user_field_id: 1,
          profile_id: 1,
          value: "1",
          candidate: 0,
        });
        await tryber.tables.CampaignDossierDataAge.do().insert({
          campaign_dossier_data_id: 1,
          max: 200,
          min: 100,
        });
      });
      afterAll(async () => {
        await tryber.tables.WpAppqEvdProfile.do().delete();
        await tryber.tables.CampaignDossierDataAge.do().delete();
        await tryber.tables.WpAppqProfileHasLang.do().delete();
        await tryber.tables.WpAppqCustomUserFieldData.do().delete();
      });

      it("Should not show the campaign", async () => {
        const response = await request(app)
          .get("/users/me/campaigns")
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(404);
      });
    });
  });
});
