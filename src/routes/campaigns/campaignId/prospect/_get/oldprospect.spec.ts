import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";
import useCampaign from "./useCampaign";

useCampaign();

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
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.status).toBe(412);
  });
});
