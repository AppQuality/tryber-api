import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("GET /campaigns/:campaignId/candidates - questions ", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 1,
      platform_id: 1,
      start_date: "2020-01-01",
      end_date: "2020-01-01",
      close_date: "2020-01-01",
      title: "Campaign",
      customer_title: "Customer",
      page_manual_id: 1,
      page_preview_id: 1,
      customer_id: 1,
      pm_id: 1,
      project_id: 1,
    });
    const profile = {
      email: "",
      name: "pippo",
      surname: "pluto",
      education_id: 1,
      employment_id: 1,
      birth_date: "2000-01-01",
    };
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        ...profile,
        id: 1,
        wp_user_id: 1,
        sex: 1,
      },
      {
        ...profile,
        id: 2,
        wp_user_id: 2,
        sex: 0,
      },
      {
        ...profile,
        id: 3,
        wp_user_id: 3,
        sex: 0,
      },
    ]);

    const candidate = {
      accepted: 0,
      devices: "0",
      campaign_id: 1,
    };
    await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
      {
        ...candidate,
        user_id: 1,
      },
      {
        ...candidate,
        user_id: 2,
      },
      {
        ...candidate,
        user_id: 3,
      },
    ]);

    const device = {
      form_factor: "Smartphone",
      manufacturer: "Apple",
      model: "iPhone 11",
      platform_id: 1,
      os_version_id: 1,
      enabled: 1,
    };
    await tryber.tables.WpCrowdAppqDevice.do().insert([
      {
        ...device,
        id: 1,
        id_profile: 1,
      },
      {
        ...device,
        id: 2,
        id_profile: 2,
      },
      {
        ...device,
        id: 3,
        id_profile: 3,
      },
    ]);

    await tryber.tables.WpAppqEvdPlatform.do().insert({
      id: 1,
      name: "iOS",
      architecture: 1,
    });
    await tryber.tables.WpAppqOs.do().insert({
      id: 1,
      display_name: "13.3.1",
      platform_id: 1,
      main_release: 1,
      version_family: 1,
      version_number: "1",
    });

    await tryber.tables.WpAppqCampaignPreselectionForm.do().insert({
      id: 1,
      campaign_id: 1,
    });
    await tryber.tables.WpAppqCampaignPreselectionFormFields.do().insert({
      id: 1,
      form_id: 1,
      question: "Text question",
      type: "text",
    });

    await tryber.tables.WpAppqCampaignPreselectionFormData.do().insert([
      {
        id: 1,
        tester_id: 1,
        value: "value1",
        field_id: 1,
        campaign_id: 1,
      },
      {
        id: 2,
        tester_id: 2,
        value: "value2",
        field_id: 1,
        campaign_id: 1,
      },
      {
        id: 3,
        tester_id: 3,
        value: "another",
        field_id: 1,
        campaign_id: 1,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
    await tryber.tables.WpCrowdAppqDevice.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
    await tryber.tables.WpAppqOs.do().delete();
    await tryber.tables.WpAppqCampaignPreselectionForm.do().delete();
    await tryber.tables.WpAppqCampaignPreselectionFormFields.do().delete();
  });

  it("Should allow filtering by question", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates?filterByInclude[question_1]=value1")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toHaveLength(1);
    expect(response.body.results[0]).toMatchObject({
      id: 1,
    });
  });
  it("Should allow filtering by multiple question", async () => {
    const response = await request(app)
      .get(
        "/campaigns/1/candidates?filterByInclude[question_1][]=value1&filterByInclude[question_1][]=value2"
      )
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toHaveLength(2);
    expect(response.body.results[0].id).toBe(2);
    expect(response.body.results[1].id).toBe(1);
  });
});
