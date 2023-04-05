import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";
import useCampaign from "./useCampaign";

useCampaign();

beforeAll(async () => {
  await tryber.tables.WpAppqEvdProfile.do().insert([
    {
      id: 2,
      name: "John",
      surname: "Doe",
      wp_user_id: 2,
      email: "",
      employment_id: 1,
      education_id: 1,
    },
    {
      id: 3,
      name: "John",
      surname: "Doe",
      wp_user_id: 3,
      email: "",
      employment_id: 1,
      education_id: 1,
    },
  ]);
  await tryber.tables.WpUsers.do().insert([{ ID: 2 }, { ID: 3 }]);
  await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
    {
      campaign_id: 1,
      user_id: 2,
      accepted: 1,
      devices: "0",
      selected_device: 1,
      results: 0,
      group_id: 0,
    },
    {
      campaign_id: 1,
      user_id: 3,
      accepted: 1,
      devices: "0",
      selected_device: 1,
      results: 0,
      group_id: 1,
    },
  ]);

  await tryber.tables.WpAppqEvdBug.do().insert([
    {
      status_id: 2,
      campaign_id: 1,
      wp_user_id: 1,
      severity_id: 4,
      reviewer: 0,
      last_editor_id: 0,
    },
    {
      status_id: 2,
      campaign_id: 1,
      wp_user_id: 1,
      severity_id: 2,
      reviewer: 0,
      last_editor_id: 0,
    },
  ]);

  await tryber.tables.WpAppqCampaignTaskGroup.do().insert([
    {
      task_id: 1,
      group_id: 0,
    },
  ]);
  await tryber.tables.WpAppqUserTask.do().insert([
    {
      tester_id: 1,
      task_id: 1,
      is_completed: 1,
    },
    {
      tester_id: 3,
      task_id: 1,
      is_completed: 1,
    },
  ]);
  await tryber.tables.WpAppqCampaignTask.do().insert([
    {
      id: 1,
      campaign_id: 1,
      is_required: 1,
      title: "UC 1",
      content: "",
      jf_code: "",
      jf_text: "",
      simple_title: "UC 1",
      info: "",
      prefix: "",
    },
  ]);
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
      is_completed: 1,
    });
  });

  afterAll(async () => {
    await tryber.tables.WpAppqProspectPayout.do().delete();
  });

  it("Should return prospect if already exist", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          note: "This is the notes",
          experience: { completion: 100, extra: 69 },
          payout: { bug: 5, completion: 25, extra: 9, refund: 1 },
          isCompleted: true,
        }),
        expect.objectContaining({
          note: `Purtroppo non hai completato l’attività, ricevi quindi -400 punti esperienza`,
          experience: { completion: -400, extra: 0 },
          payout: { bug: 0, completion: 0, extra: 0, refund: 0 },
          isCompleted: false,
        }),
      ])
    );
  });
});

describe("GET /campaigns/campaignId/prospect - there are no record", () => {
  it("Should return basic data for bugs payout", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          payout: expect.objectContaining({ bug: 7 }),
        }),
        expect.objectContaining({
          payout: expect.objectContaining({ bug: 0 }),
        }),
      ])
    );
  });

  it("Should return basic data for completion payout", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester: expect.objectContaining({ id: 1 }),
          payout: expect.objectContaining({ completion: 25 }),
          experience: expect.objectContaining({ completion: 200 }),
          note: "Ottimo lavoro!",
          isCompleted: true,
        }),
        expect.objectContaining({
          tester: expect.objectContaining({ id: 2 }),
          payout: expect.objectContaining({ completion: 0 }),
          experience: expect.objectContaining({ completion: -400 }),
          note: `Purtroppo non hai completato l’attività, ricevi quindi -400 punti esperienza`,
          isCompleted: false,
        }),
        expect.objectContaining({
          tester: expect.objectContaining({ id: 3 }),
          payout: expect.objectContaining({ completion: 0 }),
          experience: expect.objectContaining({ completion: -400 }),
          note: `Purtroppo non hai completato l’attività, ricevi quindi -400 punti esperienza`,
          isCompleted: false,
        }),
      ])
    );
  });
});

describe("GET /campaigns/campaignId/prospect - should cap at bonus bug", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqProspectPayout.do().insert({
      id: 1,
      campaign_id: 1,
      tester_id: 1,
      complete_pts: 100,
      extra_pts: 69,
      complete_eur: 25,
      bonus_bug_eur: 2000,
      extra_eur: 9,
      refund: 1,
      notes: "This is the notes",
      is_edit: 0,
      is_completed: 1,
    });
  });
  it("Should return capped bonus bug", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester: expect.objectContaining({ id: 1 }),
          payout: expect.objectContaining({ bug: 30 }),
        }),
      ])
    );
  });
});

describe("GET /campaigns/campaignId/prospect we have a prospect", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqProspect.do().insert({
      id: 1,
      campaign_id: 1,
      status: "confirmed",
      last_modified: "2021-01-01 00:00:00",
    });
  });
  it("Should return status from table wp_appq_prospect if exist", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.body.status).toEqual("confirmed");
  });
});
