import app from "@src/app";
import { tryber } from "@src/features/database";
import campaign from "@src/__mocks__/mockedDb/campaign";
import preselectionForms from "@src/__mocks__/mockedDb/preselectionForm";
import profile from "@src/__mocks__/mockedDb/profile";
import request from "supertest";

describe("GET users/me/campaigns/:campaignId/forms - logged user", () => {
  beforeAll(async () => {
    profile.insert({
      sex: 1,
      country: "Italy",
      city: "Rome",
      phone_number: "+393331234567",
    });

    await tryber.tables.WpAppqProfileHasLang.do().insert({
      profile_id: 1,
      language_id: 1,
      language_name: "Italian",
    });
  });
  afterAll(async () => {
    profile.clear();
    await tryber.tables.WpAppqProfileHasLang.do().delete();
  });

  describe("logged user", () => {
    beforeAll(async () => {
      campaign.insert({
        id: 1,
        title: "Test campaign",
        is_public: 1,
        status_id: 1,
        start_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        end_date: "2021-01-02",
        close_date: "2021-01-03",
        campaign_type_id: 1,
        os: "1,2",
      });
      preselectionForms.insert({
        id: 1,
        campaign_id: 1,
      });
    });

    afterAll(async () => {
      campaign.clear();
      preselectionForms.clear();
    });

    it("should return 200 if logged in", async () => {
      const response = await request(app)
        .get(`/users/me/campaigns/1/forms`)
        .set("Authorization", `Bearer tester`);
      expect(response.status).toBe(200);
    });

    it("should return 403 if not logged in", async () => {
      const response = await request(app).get(`/users/me/campaigns/1/forms`);
      expect(response.status).toBe(403);
    });
  });

  describe("small group", () => {
    beforeAll(async () => {
      campaign.insert({
        id: 1,
        title: "Test campaign",
        is_public: 3,
        status_id: 1,
        start_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        page_preview_id: 1,
        end_date: "2021-01-02",
        close_date: "2021-01-03",
        campaign_type_id: 1,
        os: "1,2",
      });
      preselectionForms.insert({
        id: 1,
        campaign_id: 1,
      });
      await tryber.tables.WpAppqLcAccess.do().insert({
        tester_id: 1,
        view_id: 1,
      });
    });

    afterAll(async () => {
      campaign.clear();
      preselectionForms.clear();
      await tryber.tables.WpAppqLcAccess.do().delete();
    });

    describe("tester in small group", () => {
      beforeAll(async () => {
        await tryber.tables.WpAppqLcAccess.do().insert({
          tester_id: 1,
          view_id: 1,
        });
      });

      afterAll(async () => {
        await tryber.tables.WpAppqLcAccess.do().delete();
      });
      it("should return 200 if in small group", async () => {
        const response = await request(app)
          .get(`/users/me/campaigns/1/forms`)
          .set("Authorization", `Bearer tester`);
        expect(response.status).toBe(200);
      });
    });

    describe("tester not in small group", () => {
      it("should return 403 if not in small group", async () => {
        const response = await request(app)
          .get(`/users/me/campaigns/1/forms`)
          .set("Authorization", `Bearer tester`);
        expect(response.status).toBe(404);
      });
    });
  });

  describe("target", () => {
    beforeAll(async () => {
      campaign.insert({
        id: 1,
        title: "Test campaign",
        is_public: 4,
        status_id: 1,
        start_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        page_preview_id: 1,
        end_date: "2021-01-02",
        close_date: "2021-01-03",
        campaign_type_id: 1,
        os: "1,2",
      });
      preselectionForms.insert({
        id: 1,
        campaign_id: 1,
      });
      await tryber.tables.CampaignDossierData.do().insert({
        id: 1,
        campaign_id: 1,
        created_by: 1,
        updated_by: 1,
        link: "",
      });
    });

    afterAll(async () => {
      campaign.clear();
      preselectionForms.clear();
      await tryber.tables.CampaignDossierData.do().delete();
    });

    describe("tester in target", () => {
      beforeAll(async () => {
        await tryber.tables.CampaignDossierDataLanguages.do().insert({
          campaign_dossier_data_id: 1,
          language_id: 1,
          language_name: "Italian",
        });
        await tryber.tables.CampaignDossierDataCountries.do().insert({
          campaign_dossier_data_id: 1,
          country_code: "IT",
        });
      });
      afterAll(async () => {
        await tryber.tables.CampaignDossierDataLanguages.do().delete();
        await tryber.tables.CampaignDossierDataCountries.do().delete();
      });
      it("should return 200 if in target", async () => {
        const response = await request(app)
          .get(`/users/me/campaigns/1/forms`)
          .set("Authorization", `Bearer tester`);
        expect(response.status).toBe(200);
      });
    });
    describe("tester not in target", () => {
      beforeAll(async () => {
        await tryber.tables.CampaignDossierDataLanguages.do().insert({
          campaign_dossier_data_id: 1,
          language_id: 19,
          language_name: "Afrikaans",
        });
        await tryber.tables.CampaignDossierDataCountries.do().insert({
          campaign_dossier_data_id: 1,
          country_code: "FR",
        });
      });
      afterAll(async () => {
        await tryber.tables.CampaignDossierDataLanguages.do().delete();
        await tryber.tables.CampaignDossierDataCountries.do().delete();
      });
      it("should return 403 if not in target", async () => {
        const response = await request(app)
          .get(`/users/me/campaigns/1/forms`)
          .set("Authorization", `Bearer tester`);
        expect(response.status).toBe(404);
      });
    });
  });
});
