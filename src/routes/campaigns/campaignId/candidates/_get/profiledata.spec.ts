import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("GET /campaigns/:campaignId/candidates - profile ", () => {
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
        sex: 1,
      },
      {
        ...profile,
        id: 2,
        wp_user_id: 2,
        birth_date: "1999-01-01",
        sex: 0,
      },
      {
        ...profile,
        id: 3,
        wp_user_id: 3,
        birth_date: "1998-01-01",
        sex: -1,
      },
      {
        ...profile,
        id: 4,
        wp_user_id: 4,
        birth_date: "1997-01-01",
        sex: 2,
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
      {
        ...candidate,
        user_id: 4,
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
      {
        ...device,
        id: 4,
        id_profile: 4,
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

  it("Should aswer with the genders", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          gender: "male",
        }),
        expect.objectContaining({
          id: 2,
          gender: "female",
        }),
        expect.objectContaining({
          id: 3,
          gender: "not-specified",
        }),
        expect.objectContaining({
          id: 4,
          gender: "other",
        }),
      ])
    );
  });

  it("Should allow filtering by gender", async () => {
    const responseMale = await request(app)
      .get("/campaigns/1/candidates?filterByInclude[gender]=male")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(responseMale.body).toHaveProperty("results");
    expect(responseMale.body.results).toHaveLength(1);
    expect(responseMale.body.results[0]).toHaveProperty("id", 1);
    const responseFemale = await request(app)
      .get("/campaigns/1/candidates?filterByInclude[gender]=female")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(responseFemale.body).toHaveProperty("results");
    expect(responseFemale.body.results).toHaveLength(1);
    expect(responseFemale.body.results[0]).toHaveProperty("id", 2);
    const responseOther = await request(app)
      .get("/campaigns/1/candidates?filterByInclude[gender]=other")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(responseOther.body).toHaveProperty("results");
    expect(responseOther.body.results).toHaveLength(1);
    expect(responseOther.body.results[0]).toHaveProperty("id", 4);
    const responseNotspec = await request(app)
      .get("/campaigns/1/candidates?filterByInclude[gender]=not-specified")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(responseNotspec.body).toHaveProperty("results");
    expect(responseNotspec.body.results).toHaveLength(1);
    expect(responseNotspec.body.results[0]).toHaveProperty("id", 3);
  });

  it("Should allow filtering by multiple genders", async () => {
    const responseMale = await request(app)
      .get(
        "/campaigns/1/candidates?filterByInclude[gender][]=male&filterByInclude[gender][]=female"
      )
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(responseMale.body).toHaveProperty("results");
    expect(responseMale.body.results).toHaveLength(2);
    expect(responseMale.body.results[0]).toHaveProperty("id", 2);
    expect(responseMale.body.results[1]).toHaveProperty("id", 1);
  });

  it("Should answer with the ages", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          age: 20,
        }),
        expect.objectContaining({
          id: 2,
          age: 21,
        }),
        expect.objectContaining({
          id: 3,
          age: 22,
        }),
        expect.objectContaining({
          id: 4,
          age: 23,
        }),
      ])
    );
  });

  it("Should allow filtering by minimum age", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates?filterByAge[min]=23")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toHaveLength(1);
    expect(response.body.results[0]).toHaveProperty("id", 4);
  });
  it("Should allow filtering by maximum age", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates?filterByAge[max]=20")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toHaveLength(1);
    expect(response.body.results[0]).toHaveProperty("id", 1);
  });
  it("Should allow filtering by age range", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates?filterByAge[max]=22&filterByAge[min]=21")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toHaveLength(2);
    expect(response.body.results[0]).toHaveProperty("id", 3);
    expect(response.body.results[1]).toHaveProperty("id", 2);
  });
});
