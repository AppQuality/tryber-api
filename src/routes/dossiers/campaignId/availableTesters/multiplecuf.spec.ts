import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
import ".";

describe("Route PUT /dossiers/:id/availableTesters - multiple cuf", () => {
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
    await tryber.tables.WpAppqEvdProfile.do().insert({
      id: 1,
      wp_user_id: 1,
      sex: 0,
      name: "Test User",
      email: "",
      birth_date: "2002-09-15 00:00:00",
      employment_id: 1,
      education_id: 1,
    });

    await tryber.tables.CampaignDossierDataGender.do().insert([
      {
        campaign_dossier_data_id: 1,
        gender: 0,
      },
      {
        campaign_dossier_data_id: 1,
        gender: 1,
      },
    ]);

    await tryber.tables.CampaignDossierDataAge.do().insert([
      {
        campaign_dossier_data_id: 1,
        min: 16,
        max: 17,
      },
      {
        campaign_dossier_data_id: 1,
        min: 18,
        max: 24,
      },
      {
        campaign_dossier_data_id: 1,
        min: 55,
        max: 70,
      },
    ]);

    await tryber.tables.CampaignDossierDataCuf.do().insert([
      {
        campaign_dossier_data_id: 1,
        cuf_id: 1,
        cuf_value_id: 1,
      },
      {
        campaign_dossier_data_id: 1,
        cuf_id: 2,
        cuf_value_id: 3,
      },
    ]);

    await tryber.tables.WpAppqCustomUserField.do().insert([
      {
        id: 1,
        slug: "test_field",
        type: "select",
        name: "Test Field",
        placeholder: "",
        extras: "",
        custom_user_field_group_id: 1,
      },
      {
        id: 2,
        slug: "test_field_2",
        type: "select",
        name: "Test Field 2",
        placeholder: "",
        extras: "",
        custom_user_field_group_id: 1,
      },
    ]);

    await tryber.tables.WpAppqCustomUserFieldExtras.do().insert([
      {
        id: 1,
        custom_user_field_id: 1,
        name: "Option 1",
      },
      {
        id: 2,
        custom_user_field_id: 1,
        name: "Option 2",
      },
      {
        id: 3,
        custom_user_field_id: 2,
        name: "Option 1",
      },
      {
        id: 4,
        custom_user_field_id: 2,
        name: "Option 2",
      },
    ]);

    await tryber.tables.WpAppqCustomUserFieldData.do().insert([
      {
        id: 1,
        value: "1",
        profile_id: 1,
        custom_user_field_id: 1,
        candidate: 0,
      },
      {
        id: 2,
        value: "3",
        profile_id: 1,
        custom_user_field_id: 2,
        candidate: 0,
      },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.CampaignDossierData.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
  });

  afterEach(async () => {
    await tryber.tables.WpAppqCpMeta.do().delete();
  });

  it("Should answer 200 if user has access to the campaign", async () => {
    const response = await request(app)
      .get("/dossiers/1/availableTesters?refresh=1")

      .set("authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        count: 1,
      })
    );
  });
});
