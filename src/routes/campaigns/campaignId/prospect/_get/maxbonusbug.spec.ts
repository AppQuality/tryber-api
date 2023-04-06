import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
import useCampaign from "./useCampaign";

useCampaign();

beforeAll(async () => {
  await tryber.tables.WpAppqCpMeta.do()
    .update({
      meta_value: "1",
    })
    .where({ meta_key: "payout_limit", campaign_id: 1 });
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

describe("GET /campaigns/campaignId/prospect - tester payouts were not edit", () => {
  it("Should limit bonus bug", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          payout: expect.objectContaining({ bug: 1 }),
        }),
      ])
    );
  });
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
      bonus_bug_eur: 100,
      extra_eur: 1,
      refund: 1,
      notes: "This is the notes",
    });
  });

  afterAll(async () => {
    await tryber.tables.WpAppqProspectPayout.do().delete();
  });

  it("Should limit bonus bug", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          payout: expect.objectContaining({ bug: 1 }),
        }),
      ])
    );
  });
});
