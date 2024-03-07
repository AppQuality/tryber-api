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
      sex: 1,
    };
    const candidate = {
      accepted: 0,
      devices: "0",
      campaign_id: 1,
    };
    const device = {
      form_factor: "Smartphone",
      manufacturer: "Apple",
      model: "iPhone 11",
      platform_id: 1,
      os_version_id: 1,
      enabled: 1,
    };
    for (const i in [1, 2, 3]) {
      await tryber.tables.WpAppqEvdProfile.do().insert({
        ...profile,
        id: Number(i) + 1,
        wp_user_id: Number(i) + 1,
      });
      await tryber.tables.WpCrowdAppqHasCandidate.do().insert({
        ...candidate,
        user_id: Number(i) + 1,
      });
      await tryber.tables.WpCrowdAppqDevice.do().insert({
        ...device,
        id: Number(i) + 1,
        id_profile: Number(i) + 1,
      });
    }

    await tryber.tables.WpAppqActivityLevelDefinition.do().insert([
      { id: 1, name: "Basic" },
      { id: 2, name: "Bronze" },
    ]);
    await tryber.tables.WpAppqActivityLevel.do().insert([
      { tester_id: 2, level_id: 1 },
      { tester_id: 3, level_id: 2 },
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
    await tryber.tables.WpAppqCampaignPreselectionForm.do().delete();
    await tryber.tables.WpAppqCampaignPreselectionFormFields.do().delete();
  });

  it("Should return metal level", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          levels: expect.objectContaining({
            metal: "No level",
          }),
        }),
        expect.objectContaining({
          id: 2,
          levels: expect.objectContaining({
            metal: "Basic",
          }),
        }),
        expect.objectContaining({
          id: 3,
          levels: expect.objectContaining({
            metal: "Bronze",
          }),
        }),
      ])
    );
  });

  // it("Should allow filtering by bug hunting level", async () => {
  //   const response = await request(app)
  //     .get("/campaigns/1/candidates?filterByInclude[bughunting]=Newbie")
  //     .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
  //   expect(response.body).toHaveProperty("results");
  //   expect(response.body.results).toHaveLength(1);
  //   expect(response.body.results[0].id).toBe(1);
  // });
  // it("Should allow filtering by multiple bug hunting level", async () => {
  //   const response = await request(app)
  //     .get(
  //       "/campaigns/1/candidates?filterByInclude[bughunting][]=Newbie&filterByInclude[bughunting][]=Rookie"
  //     )
  //     .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
  //   expect(response.body).toHaveProperty("results");
  //   expect(response.body.results).toHaveLength(2);
  //   expect(response.body.results[0].id).toBe(2);
  //   expect(response.body.results[1].id).toBe(1);
  // });
});
