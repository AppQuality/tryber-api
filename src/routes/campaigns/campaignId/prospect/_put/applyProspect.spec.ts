import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
import { useCampaign, usePaymentWorktypes } from "./dataset";

useCampaign();
usePaymentWorktypes();

describe("PUT /campaigns/campaignId/prospect - with database entries - 2testers 1 completed cp", () => {
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
      .put("/campaigns/1/prospect")
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
            completed: true,
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
            completed: false,
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
      .put("/campaigns/1/prospect")
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
            completed: true,
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
            completed: false,
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

describe("PUT /campaigns/campaignId/prospect - with database entries - testers with refund", () => {
  afterAll(async () => {
    await tryber.tables.WpAppqProspectPayout.do().delete();
  });
  afterEach(async () => {
    await tryber.tables.WpAppqPayment.do().delete();
    await tryber.tables.WpAppqExpPoints.do().delete();
  });
  it("Should allocate different booties for completion and refund", async () => {
    await request(app)
      .put("/campaigns/1/prospect")
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
            completed: true,
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
