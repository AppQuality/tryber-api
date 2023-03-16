import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

beforeAll(async () => {
  await tryber.tables.WpAppqEvdProfile.do().insert({
    id: 1,
    name: "John",
    surname: "Doe",
    wp_user_id: 1,
    email: "",
    employment_id: 1,
    education_id: 1,
  });
  await tryber.tables.WpUsers.do().insert({ ID: 1 });
  await tryber.tables.WpAppqEvdCampaign.do().insert({
    id: 1,
    platform_id: 1,
    start_date: "2020-01-01",
    end_date: "2020-01-01",
    title: "This is the title",
    page_preview_id: 1,
    page_manual_id: 1,
    customer_id: 1,
    pm_id: 1,
    project_id: 1,
    customer_title: "",
  });

  await tryber.tables.WpAppqEvdBug.do().insert([
    {
      id: 1,
      campaign_id: 1,
      status_id: 2,
      wp_user_id: 1,
      reviewer: 1,
      last_editor_id: 1,
      severity_id: 1,
      bug_replicability_id: 1,
      bug_type_id: 1,
      internal_id: "internal_id_1",
      message: "this is title Bug 1",
      is_favorite: 0,
    },
    {
      id: 2,
      campaign_id: 1,
      status_id: 3,
      wp_user_id: 1,
      reviewer: 1,
      last_editor_id: 1,
      severity_id: 1,
      bug_replicability_id: 1,
      bug_type_id: 1,
      internal_id: "internal_id_1",
      message: "this is title Bug 1",
      is_favorite: 0,
    },
  ]);

  await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
    {
      campaign_id: 1,
      user_id: 1,
      //subscription_date: string;
      accepted: 1,
      devices: "0",
      selected_device: 1,
      results: 0,
      //modified: string,
      group_id: 1,
    },
  ]);

  await tryber.tables.WpAppqEvdSeverity.do().insert({
    id: 1,
    name: "This is the Severity name 1",
  });
  await tryber.tables.WpAppqEvdBugStatus.do().insert([
    {
      id: 2,
      name: "Approved",
    },
    {
      id: 3,
      name: "Pending",
    },
  ]);
  await tryber.tables.WpAppqEvdBugType.do().insert({
    id: 1,
    name: "Crash",
  });
  /**
      meta_id, campaign_id, meta_key, meta_value
      87189,5453,point_multiplier_medium,0.1
      87188,5453,point_multiplier_low,0.05
      87187,5453,critical_bug_payout,6
      87186,5453,high_bug_payout,2.5
      87185,5453,medium_bug_payout,1
      87184,5453,low_bug_payout,0.5
      87183,5453,payout_limit,30
      87182,5453,campaign_complete_bonus_eur,15

      minimum_bugs
      percent_usecases

      wp_campaign
      id, campaign_pts
      5453, 100
   */
  await tryber.tables.WpAppqCpMeta.do().insert({});
});

describe("GET /campaigns/campaignId/prospect", () => {
  it("Should return 403 if logged out", async () => {
    const response = await request(app).get("/campaigns/1/prospect");
    expect(response.status).toBe(403);
  });

  it("Should return 403 if logged in as not admin user", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 200 if logged in as admin", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should return 200 if logged in as tester with both olps tester_selection, prospect", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    expect(response.status).toBe(200);
  });

  // should not return not candidate testers
});

describe("GET /campaigns/campaignId/prospect - tester payouts were edit", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqProspectPayout.do().insert({
      id: 1,
      campaign_id: 1,
      tester_id: 1,
      complete_pts: 1,
      extra_pts: 1,
      complete_eur: 1,
      bonus_bug_eur: 1,
      extra_eur: 1,
      refund: 1,
      notes: "This is the notes",
      is_edit: 0,
    });
  });

  afterAll(async () => {
    await tryber.tables.WpAppqProspectPayout.do().delete();
  });

  it("Should return 200 ", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    expect(response.status).toBe(200);
  });
});

describe("GET /campaigns/campaignId/prospect - there is an edit in old prospect", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqProspectPayout.do().insert({
      id: 1,
      campaign_id: 1,
      tester_id: 1,
      complete_pts: 1,
      extra_pts: 1,
      complete_eur: 1,
      bonus_bug_eur: 1,
      extra_eur: 1,
      refund: 1,
      notes: "This is the notes",
      is_edit: 1,
    });
  });

  afterAll(async () => {
    await tryber.tables.WpAppqProspectPayout.do().delete();
  });

  it("Should return 412 if some tester payout was edit", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    expect(response.status).toBe(412);
  });
});

describe("GET /campaigns/campaignId/prospect - there are no record", () => {
  beforeEach(async () => {
    await tryber.tables.WpAppqProspectPayout.do().delete();
  });
  // it("Should return prospect for each tester with default payout data", async () => {
  //   const response = await request(app)
  //     .get("/campaigns/1/prospect")
  //     .set(
  //       "Authorization",
  //       'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
  //     );
  //   expect(response.status).toBe(200);
  //   expect(response.body).toHaveProperty("items");

  // });
  it("Should return prospect for each tester with tester data", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester: { id: 1, name: "John", surname: "Doe" },
        }),
      ])
    );
  });
});
