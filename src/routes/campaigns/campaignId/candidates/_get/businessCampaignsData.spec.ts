import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

jest.useFakeTimers().setSystemTime(new Date("2020-01-01"));

describe("GET /campaigns/:campaignId/candidates - business Campaigns ", () => {
  beforeAll(async () => {
    const campaign = {
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
    };

    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        ...campaign,
        id: 1,
        is_business: 1,
      },
      {
        ...campaign,
        id: 2,
        is_business: 1,
      },
      {
        ...campaign,
        id: 3,
        is_business: 1,
      },
      {
        ...campaign,
        id: 4,
        is_business: 0,
      },
    ]);

    const profile = {
      email: "",
      name: "pippo",
      surname: "pluto",
      education_id: 1,
      employment_id: 1,
      birth_date: "2000-01-01",
      sex: 1,
    };
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        ...profile,
        id: 1,
        wp_user_id: 1,
      },
      {
        ...profile,
        id: 2,
        wp_user_id: 2,
      },
      {
        ...profile,
        id: 3,
        wp_user_id: 3,
      },
    ]);

    const candidate = {
      accepted: 0,
      devices: "0",
    };
    await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
      {
        ...candidate,
        user_id: 1,
        campaign_id: 1,
        subscription_date: "2019-11-15T00:00:00.000Z",
      },
      {
        ...candidate,
        user_id: 1,
        campaign_id: 2,
        subscription_date: "2019-12-15T00:00:00.000Z",
      },
      {
        ...candidate,
        user_id: 1,
        campaign_id: 4,
        subscription_date: "2019-11-15T00:00:00.000Z",
      },
      {
        ...candidate,
        user_id: 2,
        campaign_id: 1,
        subscription_date: "2020-01-01T00:00:00.000Z",
      },
      {
        ...candidate,
        user_id: 2,
        campaign_id: 2,
        subscription_date: "2019-11-15T00:00:00.000Z",
      },
      {
        ...candidate,
        user_id: 2,
        campaign_id: 4,
        subscription_date: "2020-01-01T00:00:00.000Z",
      },
      {
        ...candidate,
        user_id: 3,
        campaign_id: 2,
        subscription_date: "2019-12-17T00:00:00.000Z",
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

    const bug = {
      reviewer: 1,
      last_editor_id: 1,
      status_id: 2,
      description: "Bug",
    };
    await tryber.tables.WpAppqEvdBug.do().insert([
      { ...bug, wp_user_id: 1, id: 2, description: "Bug 2", campaign_id: 1 },
      { ...bug, wp_user_id: 1, id: 3, description: "Bug 3", campaign_id: 2 },
      { ...bug, wp_user_id: 1, id: 4, description: "Bug 4", campaign_id: 2 },
      { ...bug, wp_user_id: 2, id: 5, description: "Bug 5", campaign_id: 1 },
      { ...bug, wp_user_id: 2, id: 6, description: "Bug 6", campaign_id: 1 },
      { ...bug, wp_user_id: 2, id: 7, campaign_id: 4 },
      { ...bug, wp_user_id: 1, id: 8, campaign_id: 4 },
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
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
    await tryber.tables.WpCrowdAppqDevice.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
    await tryber.tables.WpAppqOs.do().delete();
  });

  it("Should return all business campaigns user done", async () => {
    const response = await request(app)
      .get("/campaigns/2/candidates")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          businessCps: 2,
        }),
        expect.objectContaining({
          id: 2,
          businessCps: 1,
        }),
        expect.objectContaining({
          id: 3,
          businessCps: 0,
        }),
      ])
    );
  });

  it("Should return last-month business campaigns user done", async () => {
    const response = await request(app)
      .get("/campaigns/2/candidates")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          businessCpsLastMonth: 1,
        }),
        expect.objectContaining({
          id: 2,
          businessCpsLastMonth: 1,
        }),
        expect.objectContaining({
          id: 3,
          businessCpsLastMonth: 0,
        }),
      ])
    );
  });
});
