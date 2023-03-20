import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";
import useCampaign from "./useCampaign";

useCampaign();

beforeAll(async () => {
  await tryber.tables.WpAppqEvdProfile.do().insert([
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
  await tryber.tables.WpUsers.do().insert([{ ID: 2 }]);
  await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
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
          note: "This is the notes",
          experience: { completion: 100, extra: 69 },
          payout: { bug: 5, completion: 25, extra: 9, refund: 1 },
        }),
        expect.objectContaining({
          note: "",
          experience: { completion: 0, extra: 0 },
          payout: { bug: 0, completion: 0, extra: 0, refund: 0 },
        }),
      ])
    );
    expect(response.body.items.length).toEqual(2);
  });
});

describe("GET /campaigns/campaignId/prospect - there are no record", () => {
  it("Should return basic data for bugs payout", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
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
    expect(response.body.items.length).toEqual(2);
  });
});
