import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";
import { useCampaign, usePaymentWorktypes } from "./dataset";

useCampaign();
usePaymentWorktypes();

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
  await tryber.tables.WpAppqEvdProfile.do().insert([
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
  await tryber.tables.WpUsers.do().insert([{ ID: 3 }]);
  await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
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
      campaign_id: 1, // T1 - bug Approved
      wp_user_id: 1,
      reviewer: 1,
      last_editor_id: 1,
      status_id: 2,
    },
    {
      campaign_id: 1, // T2 - bug Approved
      wp_user_id: 2,
      reviewer: 1,
      last_editor_id: 1,
      status_id: 2,
    },
    {
      campaign_id: 1, // T2 - bug Refused
      wp_user_id: 2,
      reviewer: 1,
      last_editor_id: 1,
      status_id: 1,
    },
    {
      campaign_id: 1, // T3 - bug Approved
      wp_user_id: 3,
      reviewer: 1,
      last_editor_id: 1,
      status_id: 2,
    },
    {
      campaign_id: 1, // T3 - bug Need Review
      wp_user_id: 3,
      reviewer: 1,
      last_editor_id: 1,
      status_id: 4,
    },
  ]);
});
afterEach(async () => {
  await tryber.tables.WpAppqProspectPayout.do().delete();
  await tryber.tables.WpAppqPayment.do().delete();
  await tryber.tables.WpAppqExpPoints.do().delete();
});

describe("PATCH /campaigns/campaignId/prospect - perfect - configured", () => {
  beforeAll(async () => {
    await tryber.tables.WpOptions.do().insert({
      option_id: 1,
      option_name: "options_point_multiplier_perfect_campaign",
      option_value: "0.5",
    });
  });
  afterAll(async () => {
    await tryber.tables.WpOptions.do().delete();
  });

  it("Should add bonus perfect to exp if there are no bug refused, need-review", async () => {
    await request(app)
      .patch("/campaigns/1/prospect")
      .send({
        status: "done",
        items: [
          {
            tester: { id: 1 },
            experience: { completion: 100, extra: 0 },
            payout: {
              completion: 5,
              bug: 2,
              extra: 0,
              refund: 0,
            },
          },
          {
            tester: { id: 2 },
            experience: { completion: 100, extra: 0 },
            payout: {
              completion: 5,
              bug: 2,
              extra: 0,
              refund: 0,
            },
          },
          {
            tester: { id: 3 },
            experience: { completion: 100, extra: 0 },
            payout: {
              completion: 5,
              bug: 2,
              extra: 0,
              refund: 0,
            },
          },
        ],
      })
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );

    const exp_points = await tryber.tables.WpAppqExpPoints.do()
      .select()
      .where({ campaign_id: 1, activity_id: 4 });
    expect(exp_points).toHaveLength(1);
    expect(exp_points).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester_id: 1,
          campaign_id: 1,
          activity_id: 4,
          reason:
            "Congratulations all your submitted bugs have been approved, here a bonus for you",
          pm_id: 1,
          amount: 100, // 200 * 0.5
          bug_id: -1,
        }),
      ])
    );
  });
});

describe("PATCH /campaigns/campaignId/prospect - perfect - not configured", () => {
  it("Should add bonus perfect using default multiplier if there's  no options_point_multiplier_perfect_campaign", async () => {
    await request(app)
      .patch("/campaigns/1/prospect")
      .send({
        status: "done",
        items: [
          {
            tester: { id: 1 },
            experience: { completion: 100, extra: 0 },
            payout: {
              completion: 5,
              bug: 2,
              extra: 0,
              refund: 0,
            },
          },
          {
            tester: { id: 2 },
            experience: { completion: 100, extra: 0 },
            payout: {
              completion: 5,
              bug: 2,
              extra: 0,
              refund: 0,
            },
          },
          {
            tester: { id: 3 },
            experience: { completion: 100, extra: 0 },
            payout: {
              completion: 5,
              bug: 2,
              extra: 0,
              refund: 0,
            },
          },
        ],
      })
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    const exp_points = await tryber.tables.WpAppqExpPoints.do()
      .select()
      .where({ campaign_id: 1, activity_id: 4 });
    expect(exp_points).toHaveLength(1);
    expect(exp_points).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester_id: 1,
          campaign_id: 1,
          activity_id: 4,
          reason:
            "Congratulations all your submitted bugs have been approved, here a bonus for you",
          pm_id: 1,
          amount: 50, // 100 * 0.25
          bug_id: -1,
        }),
      ])
    );
  });
});
