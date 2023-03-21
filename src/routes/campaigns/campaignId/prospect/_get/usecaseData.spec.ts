import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";
import useCampaign from "./useCampaign";

useCampaign();

beforeAll(async () => {
  await tryber.tables.WpAppqEvdProfile.do().insert([
    {
      // tester che ha completato al 100% la campagna - il default è 75%
      id: 2,
      name: "John",
      surname: "Doe",
      wp_user_id: 2,
      email: "",
      employment_id: 1,
      education_id: 1,
    },
  ]);
  await tryber.tables.WpUsers.do().insert([{ ID: 2 }]);

  await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
    {
      campaign_id: 1,
      user_id: 2,
      accepted: 1,
      devices: "0",
      selected_device: 1,
      results: 0,
      group_id: 1,
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
});

describe("GET /campaigns/campaignId/prospect - there are no record", () => {
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
