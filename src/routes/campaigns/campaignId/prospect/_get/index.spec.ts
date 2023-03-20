import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

beforeAll(async () => {
  await tryber.tables.WpAppqEvdProfile.do().insert([
    {
      // tester che ha completato al 100% la campagna - il default è 75%
      id: 1,
      name: "John",
      surname: "Doe",
      wp_user_id: 1,
      email: "",
      employment_id: 1,
      education_id: 1,
    },
    {
      // tester che ha completato al 40% la campagna
      id: 2,
      name: "John",
      surname: "Doe",
      wp_user_id: 2,
      email: "",
      employment_id: 1,
      education_id: 1,
    },
  ]);
  await tryber.tables.WpUsers.do().insert([{ ID: 1 }, { ID: 2 }]);
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
      severity_id: 4,
      bug_replicability_id: 1,
      bug_type_id: 1,
      internal_id: "internal_id_1",
      message: "this is title Bug 1",
      is_favorite: 0,
    },
    {
      id: 2,
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
      id: 3, // This is a pending bug
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
      accepted: 1,
      devices: "0",
      selected_device: 1,
      results: 0,
      group_id: 1,
    },
    {
      campaign_id: 1,
      user_id: 2,
      accepted: 1,
      devices: "0",
      selected_device: 1,
      results: 0,
      group_id: 2,
    },
  ]);

  await tryber.tables.WpAppqCampaignTaskGroup.do().insert([
    {
      //gruppo 1 tester 1
      task_id: 1,
      group_id: 0, // all
    },
    {
      //gruppo 2 non tester 2
      task_id: 2,
      group_id: 0, // all
    },
    {
      task_id: 3,
      group_id: 1, // Group 1
    },
    {
      task_id: 4,
      group_id: 2, // Group 2
    },
    {
      task_id: 5, // Group 1 and 2
      group_id: 1, // Group 1
    },
    {
      task_id: 5, // Group 1 and 2
      group_id: 2, // Group 2
    },
  ]);
  await tryber.tables.WpAppqUserTask.do().insert([
    {
      // tester 1 caso duso 1 (gruppo all - group_id: 0)
      tester_id: 1,
      task_id: 1,
      is_completed: 1,
    },
    {
      // tester 1 caso duso 2
      tester_id: 1,
      task_id: 2,
      is_completed: 1,
    },
    {
      // tester 1 caso duso 3
      tester_id: 1,
      task_id: 3,
      is_completed: 1,
    },
    {
      // tester 2 caso duso 3 così ne ha fatto uno
      tester_id: 1,
      task_id: 5,
      is_completed: 0,
    },
    {
      // tester 2 caso duso 2 così ne ha fatto uno
      tester_id: 2,
      task_id: 1,
      is_completed: 0,
    },
    {
      // tester 2 caso duso 2 così ne ha fatto uno
      tester_id: 2,
      task_id: 2,
      is_completed: 0,
    },
    {
      // tester 2 caso duso 2 così ne ha fatto uno
      tester_id: 2,
      task_id: 4,
      is_completed: 0,
    },
    {
      // tester 2 caso duso 2 così ne ha fatto uno
      tester_id: 2,
      task_id: 5,
      is_completed: 0,
    },
  ]);
  await tryber.tables.WpAppqCampaignTask.do().insert([
    {
      // un caso duso 1 non required gruppo all
      id: 1,
      title: "UC 1",
      campaign_id: 1,
      is_required: 0,
      group_id: -1, // all
      content: "content uc 1",
      jf_code: "",
      jf_text: "",
      simple_title: "UC 1",
      info: "info",
      prefix: "prefix",
    },
    {
      // un caso duso 2 required gruppo all
      id: 2,
      title: "UC 2",
      campaign_id: 1,
      is_required: 1,
      group_id: -1, // all
      content: "content uc 2",
      jf_code: "",
      jf_text: "",
      simple_title: "UC 2",
      info: "info",
      prefix: "prefix",
    },
    {
      // un caso duso 3 required gruppo 1 del tester
      id: 3,
      title: "UC 3",
      campaign_id: 1,
      is_required: 1,
      group_id: 1, // Group 1
      content: "content uc 3",
      jf_code: "",
      jf_text: "",
      simple_title: "UC 3",
      info: "info",
      prefix: "prefix",
    },
    {
      // un caso duso 4 required gruppo 1 (tesert) e 2
      id: 4,
      title: "UC 4",
      campaign_id: 1,
      is_required: 1,
      group_id: 2, // Group 2
      content: "content uc 4",
      jf_code: "",
      jf_text: "",
      simple_title: "UC 4",
      info: "info",
      prefix: "prefix",
    },
    {
      // un caso duso 5 non required gruppo 2 (non del tester)
      id: 5,
      title: "UC 5",
      campaign_id: 1,
      is_required: 0,
      group_id: 2, // Group 2
      content: "content uc 5",
      jf_code: "",
      jf_text: "",
      simple_title: "UC 5",
      info: "info",
      prefix: "prefix",
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

  await tryber.tables.WpAppqCpMeta.do().insert({});

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
      complete_pts: 100,
      extra_pts: 69,
      complete_eur: 25,
      bonus_bug_eur: 5,
      extra_eur: 9,
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

  it("Should return prospect if already exist", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester: { id: 1, name: "John", surname: "Doe" },
          bugs: { critical: 1, high: 0, low: 1, medium: 0 },
          usecases: { completed: 2, required: 2 },
          note: "This is the notes",
          experience: { completion: 100, extra: 69 },
          payout: { bug: 5, completion: 25, extra: 9, refund: 1 },
          // status: "pending",
        }),
        expect.objectContaining({
          tester: { id: 2, name: "John", surname: "Doe" },
          bugs: { critical: 0, high: 0, low: 0, medium: 0 },
          usecases: { completed: 0, required: 2 },
          note: "",
          experience: { completion: 0, extra: 0 },
          payout: { bug: 0, completion: 0, extra: 0, refund: 0 },
          // status: "pending",
        }),
      ])
    );
    expect(response.body.items.length).toEqual(2);
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
  it("Should return prospect with property items", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("items");
  });
  it("Should return prospect for each tester with tester data", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    expect(response.status).toBe(200);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester: { id: 1, name: "John", surname: "Doe" },
        }),
        expect.objectContaining({
          tester: { id: 2, name: "John", surname: "Doe" },
        }),
      ])
    );
    expect(response.body.items.length).toEqual(2);
  });
  it("Should return prospect for each tester with uploaded bugs counters", async () => {
    //we expect that uploaded bugs have just status 2 = approved
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    expect(response.status).toBe(200);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          bugs: { critical: 1, high: 0, medium: 0, low: 1 },
        }),
        expect.objectContaining({
          bugs: { critical: 0, high: 0, medium: 0, low: 0 },
        }),
      ])
    );
    expect(response.body.items.length).toEqual(2);
  });

  it("Should return prospect for each tester with usecases data", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          usecases: { completed: 2, required: 2 },
        }),
        expect.objectContaining({
          usecases: { completed: 0, required: 2 },
        }),
      ])
    );
    expect(response.body.items.length).toEqual(2);
  });
});
