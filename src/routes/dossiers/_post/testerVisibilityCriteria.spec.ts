import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

jest.mock("@src/features/wp/WordpressJsonApiTrigger");
jest.mock("@src/features/webhookTrigger");

const baseRequest = {
  project: 1,
  testType: 1,
  title: {
    customer: "Campaign Title for Customer",
    tester: "Campaign Title for Tester",
  },
  startDate: "2019-08-24T14:15:22Z",
  deviceList: [1],
};

describe("Route POST /dossiers - visibility criteria for testers", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqProject.do().insert({
      id: 1,
      display_name: "Test Project",
      customer_id: 1,
      edited_by: 1,
    });

    await tryber.tables.WpAppqCampaignType.do().insert({
      id: 1,
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
    ]);
    await tryber.tables.WpAppqCustomUserField.do().insert([
      {
        id: 10,
        slug: "test_cuf1",
        name: "Test CUF 1",
        placeholder: "Test CUF 1 Placeholder",
        extras: "Test CUF 1 Extras",
        type: "select",
        custom_user_field_group_id: 1,
      },
      {
        id: 20,
        slug: "test_cuf2",
        name: "Test CUF 2",
        placeholder: "Test CUF 2 Placeholder",
        extras: "Test CUF 2 Extras",
        type: "multiselect",
        custom_user_field_group_id: 2,
      },
      {
        id: 30,
        slug: "test_cuf3",
        name: "Test CUF 3",
        placeholder: "Test CUF 3 Placeholder",
        extras: "Test CUF 3 Extras",
        type: "text",
        custom_user_field_group_id: 3,
      },
    ]);
    await tryber.tables.WpAppqCustomUserFieldExtras.do().insert([
      {
        id: 100,
        custom_user_field_id: 10,
        name: "Test CUF 1 Value 1",
      },
      {
        id: 200,
        custom_user_field_id: 20,
        name: "Test CUF 2 Value 1",
      },
    ]);
  });

  beforeEach(async () => {});

  afterAll(async () => {
    await tryber.tables.WpAppqProject.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
    await tryber.tables.WpAppqCustomUserField.do().delete();
    await tryber.tables.WpAppqCustomUserFieldExtras.do().delete();
  });
  afterEach(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.CampaignDossierData.do().delete();
    await tryber.tables.CampaignDossierDataBrowsers.do().delete();
    await tryber.tables.CampaignDossierDataCountries.do().delete();
    await tryber.tables.CampaignDossierDataLanguages.do().delete();
    await tryber.tables.WpAppqCampaignAdditionalFields.do().delete();
    await tryber.tables.CampaignDossierDataCuf.do().delete();
    jest.clearAllMocks();
  });

  describe("Visibility Criteria - Cuf", () => {
    it("Should return an error if sending a CUF that does not exist", async () => {
      const response = await request(app)
        .post("/dossiers")
        .send({
          ...baseRequest,
          visibilityCriteria: {
            cuf: [
              {
                cuf_id: 999, // Non-existent CUF ID
                cuf_value_id: 999, // Non-existent CUF Value ID
              },
              {
                cuf_id: 10, // Existing CUF ID
                cuf_value_id: 100, // Existing CUF Value ID
              },
            ],
          },
        })
        .set("Authorization", "Bearer admin");

      expect(response.status).toBe(406);
      expect(response.body).toMatchObject({
        message: "Invalid Custom User Field submitted",
      });
    });

    it("Should return an error if the CUF type is other than 'select' and 'multiselect'", async () => {
      const response = await request(app)
        .post("/dossiers")
        .send({
          ...baseRequest,
          visibilityCriteria: {
            cuf: [
              {
                cuf_id: 30, // Existing CUF ID with type 'text'
                cuf_value_id: 300, // Non-existent CUF Value ID
              },
              {
                cuf_id: 10, // Existing CUF ID
                cuf_value_id: 100, // Existing CUF Value ID
              }, // Existing CUF Extras
            ],
          },
        })
        .set("Authorization", "Bearer admin");

      expect(response.status).toBe(406);
      expect(response.body).toMatchObject({
        message: "Invalid Custom User Field submitted",
      });
    });

    it("Should return 201 if send valid cuf", async () => {
      const response = await request(app)
        .post("/dossiers")
        .send({
          ...baseRequest,
          visibilityCriteria: {
            cuf: [
              {
                cuf_id: 10, // Existing CUF ID
                cuf_value_id: 100, // Existing CUF Value ID
              }, // Existing CUF Extras
              {
                cuf_id: 20, // Existing CUF ID
                cuf_value_id: 200, // Existing CUF Value ID
              }, // Existing CUF Extras
            ],
          },
        })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(201);
    });

    it("Should add cuf if send valid cuf", async () => {
      const response = await request(app)
        .post("/dossiers")
        .send({
          ...baseRequest,
          visibilityCriteria: {
            cuf: [
              {
                cuf_id: 10, // Existing CUF ID
                cuf_value_id: 100, // Existing CUF Value ID
              }, // Existing CUF Extras
              {
                cuf_id: 20, // Existing CUF ID
                cuf_value_id: 200, // Existing CUF Value ID
              }, // Existing CUF Extras
            ],
          },
        })
        .set("Authorization", "Bearer admin");

      const dossierCuf = await tryber.tables.CampaignDossierDataCuf.do()
        .select("cuf_id", "cuf_value_id")
        .join(
          "campaign_dossier_data",
          "campaign_dossier_data_cuf.campaign_dossier_data_id",
          "campaign_dossier_data.id"
        )
        .where("campaign_dossier_data.campaign_id", response.body.id);

      expect(dossierCuf).toHaveLength(2);

      expect(dossierCuf[0]).toMatchObject({
        cuf_id: 10,
        cuf_value_id: 100, // Test CUF 1 Value 1
      });
      expect(dossierCuf[1]).toMatchObject({
        cuf_id: 20,
        cuf_value_id: 200, // Test CUF 2 Value 1
      });
    });
  });

  describe("Visibility Criteria - Age criterias", () => {
    afterEach(async () => {
      await tryber.tables.CampaignDossierDataAge.do().delete();
    });

    it("Should add dossier age ranges if sent", async () => {
      const response = await request(app)
        .post("/dossiers")
        .send({
          ...baseRequest,
          visibilityCriteria: {
            age_ranges: [
              {
                min: 18,
                max: 25,
              },
              {
                min: 26,
                max: 35,
              },
            ],
          },
        })
        .set("Authorization", "Bearer admin");

      const dossierAge = await tryber.tables.CampaignDossierDataAge.do()
        .select("min", "max")
        .join(
          "campaign_dossier_data",
          "campaign_dossier_data_age.campaign_dossier_data_id",
          "campaign_dossier_data.id"
        )
        .where("campaign_dossier_data.campaign_id", response.body.id);

      expect(dossierAge).toHaveLength(2);

      expect(dossierAge[0]).toMatchObject({
        min: 18,
        max: 25,
      });
      expect(dossierAge[1]).toMatchObject({
        min: 26,
        max: 35,
      });
    });
  });
});
