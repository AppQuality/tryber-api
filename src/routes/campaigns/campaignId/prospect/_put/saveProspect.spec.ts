import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
import { useCampaign } from "./dataset";

useCampaign();

describe("PUT /campaigns/campaignId/prospect - save prospect from default", () => {
  afterEach(async () => {
    await tryber.tables.WpAppqProspect.do().delete();
    await tryber.tables.WpAppqProspectPayout.do().delete();
    await tryber.tables.WpAppqExpPoints.do().delete();
    await tryber.tables.WpAppqPayment.do().delete();
  });

  it("Should save prospect", async () => {
    const response = await request(app)
      .put("/campaigns/1/prospect")
      .send({
        status: "done",
        items: [
          {
            tester: { id: 1 },
            experience: { completion: 10, extra: 20 },
            payout: {
              completion: 1,
              bug: 2,
              extra: 3,
              refund: 4,
            },
            note: "note",
            completed: true,
          },
        ],
      })
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    expect(response.status).toBe(200);
    const prospect = await tryber.tables.WpAppqProspectPayout.do().select();
    expect(prospect).toHaveLength(1);
    expect(prospect[0].tester_id).toBe(1);
    expect(prospect[0].campaign_id).toBe(1);
    expect(prospect[0].complete_eur).toBe(1);
    expect(prospect[0].bonus_bug_eur).toBe(2);
    expect(prospect[0].extra_eur).toBe(3);
    expect(prospect[0].refund).toBe(4);
    expect(prospect[0].complete_pts).toBe(10);
    expect(prospect[0].extra_pts).toBe(20);
    expect(prospect[0].notes).toBe("note");
    expect(prospect[0].is_completed).toBe(1);
  });

  it("Should prospect as not completed", async () => {
    const response = await request(app)
      .put("/campaigns/1/prospect")
      .send({
        status: "done",
        items: [
          {
            tester: { id: 1 },
            experience: { completion: 10, extra: 20 },
            payout: {
              completion: 1,
              bug: 2,
              extra: 3,
              refund: 4,
            },
            note: "note",
            completed: false,
          },
        ],
      })
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    expect(response.status).toBe(200);
    const prospect = await tryber.tables.WpAppqProspectPayout.do().select();
    expect(prospect).toHaveLength(1);
    expect(prospect[0].is_completed).toBe(0);
  });

  it("Should save prospect status to table", async () => {
    const response = await request(app)
      .put("/campaigns/1/prospect")
      .send({
        status: "done",
        items: [
          {
            tester: { id: 1 },
            experience: { completion: 10, extra: 20 },
            payout: {
              completion: 1,
              bug: 2,
              extra: 3,
              refund: 4,
            },
            note: "note",
            completed: false,
          },
        ],
      })
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    expect(response.status).toBe(200);
    const prospect = await tryber.tables.WpAppqProspect.do()
      .select()
      .where("campaign_id", 1);
    expect(prospect).toHaveLength(1);
    expect(prospect[0].status).toBe("done");

    const prospectItems =
      await tryber.tables.WpAppqProspectPayout.do().select();
    expect(prospectItems).toHaveLength(1);
    expect(prospectItems[0].prospect_id).toBe(prospect[0].id);
  });
});

describe("PUT /campaigns/campaignId/prospect - update prospect from db", () => {
  beforeEach(async () => {
    await tryber.tables.WpAppqProspectPayout.do().insert({
      tester_id: 1,
      campaign_id: 1,
      complete_eur: 100,
      bonus_bug_eur: 100,
      extra_eur: 100,
      refund: 100,
      complete_pts: 100,
      extra_pts: 100,
      prospect_id: 10000,
    });
  });
  afterEach(async () => {
    await tryber.tables.WpAppqProspect.do().delete();
    await tryber.tables.WpAppqProspectPayout.do().delete();
    await tryber.tables.WpAppqExpPoints.do().delete();
    await tryber.tables.WpAppqPayment.do().delete();
  });

  it("Should save prospect", async () => {
    const response = await request(app)
      .put("/campaigns/1/prospect")
      .send({
        status: "done",
        items: [
          {
            tester: { id: 1 },
            experience: { completion: 10, extra: 20 },
            payout: {
              completion: 1,
              bug: 2,
              extra: 3,
              refund: 4,
            },
            note: "note",
            completed: true,
          },
        ],
      })
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    expect(response.status).toBe(200);
    const prospect = await tryber.tables.WpAppqProspectPayout.do().select();
    expect(prospect).toHaveLength(1);
    expect(prospect[0].tester_id).toBe(1);
    expect(prospect[0].campaign_id).toBe(1);
    expect(prospect[0].complete_eur).toBe(1);
    expect(prospect[0].bonus_bug_eur).toBe(2);
    expect(prospect[0].extra_eur).toBe(3);
    expect(prospect[0].refund).toBe(4);
    expect(prospect[0].complete_pts).toBe(10);
    expect(prospect[0].extra_pts).toBe(20);
    expect(prospect[0].notes).toBe("note");
    expect(prospect[0].is_completed).toBe(1);
  });

  it("Should save prospect status to table", async () => {
    const response = await request(app)
      .put("/campaigns/1/prospect")
      .send({
        status: "done",
        items: [
          {
            tester: { id: 1 },
            experience: { completion: 10, extra: 20 },
            payout: {
              completion: 1,
              bug: 2,
              extra: 3,
              refund: 4,
            },
            note: "note",
            completed: false,
          },
        ],
      })
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    expect(response.status).toBe(200);
    const prospect = await tryber.tables.WpAppqProspect.do()
      .select()
      .where("campaign_id", 1);
    expect(prospect).toHaveLength(1);
    expect(prospect[0].status).toBe("done");

    const prospectItems =
      await tryber.tables.WpAppqProspectPayout.do().select();
    expect(prospectItems).toHaveLength(1);
    expect(prospectItems[0].prospect_id).toBe(prospect[0].id);
    expect(prospectItems[0].prospect_id).not.toBe(10000);
  });
});
