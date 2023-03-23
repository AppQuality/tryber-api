import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";
import { useCampaign, usePaymentWorktypes } from "./dataset";

useCampaign();
usePaymentWorktypes();

describe("PATCH /campaigns/campaignId/prospect - with database entries - 2testers 1 completed cp", () => {
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
  });
  afterAll(async () => {
    await tryber.tables.WpAppqProspectPayout.do().delete();
  });
  afterEach(async () => {
    await tryber.tables.WpAppqPayment.do().delete();
    await tryber.tables.WpAppqExpPoints.do().delete();
  });

  it("Should assign exp points for each tester that has a prospect", async () => {
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
            experience: { completion: -400, extra: 0 },
            payout: {
              completion: 0,
              bug: 0,
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
      .where({ campaign_id: 1, activity_id: 1 });
    expect(exp_points).toHaveLength(2);
    expect(exp_points).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester_id: 1,
          campaign_id: 1,
          activity_id: 1,
          reason: "[CP1] This is the title - Campaign successfully completed",
          pm_id: 1,
          amount: 100,
          bug_id: -1,
        }),
        expect.objectContaining({
          tester_id: 2,
          campaign_id: 1,
          activity_id: 1,
          reason: "[CP1] This is the title - Campaign unsuccessfully completed",
          pm_id: 1,
          amount: -400,
          bug_id: -1,
        }),
      ])
    );
    expect(exp_points[0].creation_date).toBeNow(1);
    expect(exp_points[1].creation_date).toBeNow(1);
  });

  it("Should allocate the booty to the testers who have amount > 0", async () => {
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
            experience: { completion: -400, extra: 0 },
            payout: {
              completion: 0,
              bug: 0,
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
    const booties = await tryber.tables.WpAppqPayment.do()
      .select()
      .where({ campaign_id: 1 });
    expect(booties).toHaveLength(1);
    expect(booties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester_id: 1,
          campaign_id: 1,
          work_type: "Tryber Test",
          work_type_id: 1,
          created_by: 1,
          is_requested: 0,
          request_id: 0,
          is_paid: 0,
          receipt_id: -1,
          note: "[CP1] This is the title",
          amount: 5 + 2 + 0 + 0,
        }),
      ])
    );
    expect(booties[0].creation_date).toBeNow(1);
  });
});

describe("PATCH /campaigns/campaignId/prospect - with database entries - testers with refund", () => {
  afterAll(async () => {
    await tryber.tables.WpAppqProspectPayout.do().delete();
  });
  afterEach(async () => {
    await tryber.tables.WpAppqPayment.do().delete();
    await tryber.tables.WpAppqExpPoints.do().delete();
  });
  it("Should allocate different booties for completion and refund", async () => {
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
              refund: 9,
            },
          },
        ],
      })
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    const booties = await tryber.tables.WpAppqPayment.do()
      .select()
      .where({ campaign_id: 1 });
    expect(booties).toHaveLength(2);
    expect(booties[0]).toEqual(
      expect.objectContaining({
        tester_id: 1,
        campaign_id: 1,
        work_type: "Tryber Test",
        work_type_id: 1,
        created_by: 1,
        is_requested: 0,
        request_id: 0,
        is_paid: 0,
        receipt_id: -1,
        note: "[CP1] This is the title",
        amount: 5 + 2 + 0 + 0,
      })
    );
    expect(booties[1]).toEqual(
      expect.objectContaining({
        tester_id: 1,
        campaign_id: 1,
        work_type: "Refund Tryber Test",
        work_type_id: 3,
        created_by: 1,
        is_requested: 0,
        request_id: 0,
        is_paid: 0,
        receipt_id: -1,
        note: "[CP1] This is the title - Refund",
        amount: 9,
      })
    );
  });
});

describe("PATCH /campaigns/campaignId/prospect - with database entries - tester made perfect", () => {
  beforeAll(async () => {
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
    await tryber.tables.WpAppqProspectPayout.do().insert([
      {
        id: 1,
        campaign_id: 1,
        tester_id: 1,
        complete_pts: 100,
        extra_pts: 0,
        complete_eur: 5,
        bonus_bug_eur: 2,
        extra_eur: 0,
        refund: 0,
        notes: "notes",
        is_edit: 0,
        is_completed: 0,
      },
    ]);
    await tryber.tables.WpOptions.do().insert({
      option_id: 1,
      option_name: "options_point_multiplier_perfect_campaign",
      option_value: "0.5",
    });
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
  afterAll(async () => {
    await tryber.tables.WpAppqProspectPayout.do().delete();
    await tryber.tables.WpOptions.do().delete();
  });
  afterEach(async () => {
    await tryber.tables.WpAppqPayment.do().delete();
    await tryber.tables.WpAppqExpPoints.do().delete();
  });
  it("Should add bonus perfect to exp if there are no bug refused, need-review", async () => {
    await request(app)
      .patch("/campaigns/1/prospect")
      .send({ status: "done" })
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
          amount: 50, // 100 * 0.5
          bug_id: -1,
        }),
      ])
    );
  });
  // it("Should add bonus perfect using default multiplier if there's  no options_point_multiplier_perfect_campaign", async () => {
  //   await tryber.tables.WpOptions.do().delete();
  //   await request(app)
  //     .patch("/campaigns/1/prospect")
  //     .send({ status: "done" })
  //     .set(
  //       "Authorization",
  //       'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
  //     );
  //     const exp_points = await tryber.tables.WpAppqExpPoints.do()
  //     .select()
  //     .where({ campaign_id: 1, activity_id: 4 });
  //   expect(exp_points).toHaveLength(1);
  //   expect(exp_points).toEqual(
  //     expect.arrayContaining([
  //       expect.objectContaining({
  //         tester_id: 1,
  //         campaign_id: 1,
  //         activity_id: 4,
  //         reason: "Congratulations all your submitted bugs have been approved, here a bonus for you",
  //         pm_id: 1,
  //         amount: 25,  // 100 * 0.25
  //         bug_id: -1,
  //       }),
  //     ])
  //   );
  // });
});
