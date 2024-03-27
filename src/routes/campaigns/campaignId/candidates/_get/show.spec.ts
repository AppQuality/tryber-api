import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("GET /campaigns/:campaignId/candidates - show ", () => {
  beforeAll(async () => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-01"));
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
    };
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        ...profile,
        id: 1,
        wp_user_id: 1,
        birth_date: "2000-01-01",
        total_exp_pts: 100,
        sex: 1,
      },
      {
        ...profile,
        id: 2,
        wp_user_id: 2,
        birth_date: "1999-01-01",
        total_exp_pts: 90,
        sex: 0,
      },
    ]);

    const candidate = {
      devices: "0",
      campaign_id: 1,
    };
    await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
      {
        ...candidate,
        user_id: 1,
        accepted: 0,
      },
      {
        ...candidate,
        user_id: 2,
        accepted: 1,
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
    jest.useRealTimers();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
    await tryber.tables.WpCrowdAppqDevice.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
    await tryber.tables.WpAppqOs.do().delete();
  });

  it("Should return candidates by default", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toHaveLength(1);
    expect(response.body.results[0]).toHaveProperty("id", 1);
  });
  it("Should return candidates if show onlyCandidates", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates?show=onlyCandidates")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toHaveLength(1);
    expect(response.body.results[0]).toHaveProperty("id", 1);
  });
  it("Should return accepted if show onlyAccepted", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates?show=onlyAccepted")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toHaveLength(1);
    expect(response.body.results[0]).toHaveProperty("id", 2);
  });
  it("Should return all if show all", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates?show=all")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toHaveLength(2);
    expect(response.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
        }),
        expect.objectContaining({
          id: 2,
        }),
      ])
    );
  });
});
