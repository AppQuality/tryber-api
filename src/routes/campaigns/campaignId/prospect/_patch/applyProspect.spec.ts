import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";
import useCampaign from "../_get/useCampaign";

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
  ]);
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
    {
      id: 2,
      campaign_id: 1,
      tester_id: 2,
      complete_pts: -400,
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
});
describe("PATCH /campaigns/campaignId/prospect", () => {
  it("Should assign exp points for each tester that has a prospect", async () => {
    const response = await request(app)
      .patch("/campaigns/1/prospect")
      .send({ status: "done" })
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    const exp_points = await tryber.tables.WpAppqExpPoints.do()
      .select()
      .where({ campaign_id: 1, activity_id: 1 });
    expect(exp_points).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          tester_id: 1,
          campaign_id: 1,
          activity_id: 1,
          reason: "[CP1] This is the title - Campaign successfully completed",
          pm_id: 1,
          creation_date: new Date()
            .toISOString()
            .slice(0, 16)
            .replace("T", " "),
          amount: 100,
          bug_id: -1,
        }),
        expect.objectContaining({
          id: 2,
          tester_id: 2,
          campaign_id: 1,
          activity_id: 1,
          reason: "[CP1] This is the title - Campaign unsuccessfully completed",
          pm_id: 1,
          creation_date: new Date()
            .toISOString()
            .slice(0, 16)
            .replace("T", " "),
          amount: -400,
          bug_id: -1,
        }),
      ])
    );
  });
});
