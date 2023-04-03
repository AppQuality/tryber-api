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

  it("Should return prospect if already exist filtered including id list", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect?filterByInclude[ids]=1,3")
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.body.items.length).toEqual(2);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester: expect.objectContaining({ id: 1 }),
        }),
        expect.objectContaining({
          tester: expect.objectContaining({ id: 3 }),
        }),
      ])
    );
  });
});

it("Should return prospect if already exist filtered excluding id list", async () => {
  const response = await request(app)
    .get("/campaigns/1/prospect?filterByExclude[ids]=1,3")
    .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
  expect(response.body.items.length).toEqual(1);
  expect(response.body.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        tester: expect.objectContaining({ id: 2 }),
      }),
    ])
  );
});

describe("GET /campaigns/campaignId/prospect - there are no record", () => {
  it("Should return basic data for bugs payout filtered by including id list", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect?filterByInclude[ids]=2,0,3")
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.body.items.length).toEqual(2);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester: expect.objectContaining({ id: 2 }),
        }),
        expect.objectContaining({
          tester: expect.objectContaining({ id: 3 }),
        }),
      ])
    );
  });

  it("Should return basic data for bugs payout filtered by excluding id list", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect?filterByExclude[ids]=0,3")
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.body.items.length).toEqual(2);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester: expect.objectContaining({ id: 2 }),
        }),
        expect.objectContaining({
          tester: expect.objectContaining({ id: 1 }),
        }),
      ])
    );
  });
});
