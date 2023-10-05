import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
import useCampaign from "./useCampaign";

useCampaign();

beforeAll(async () => {
  await tryber.tables.WpAppqEvdProfile.do().insert([
    {
      // tester che ha completato al 100% la campagna - il default è 75%
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

  await tryber.tables.WpAppqEvdBug.do().insert([
    {
      campaign_id: 1,
      status_id: 2,
      wp_user_id: 1,
      profile_id: 1,
      reviewer: 1,
      last_editor_id: 1,
      severity_id: 4,
    },
    {
      campaign_id: 1,
      status_id: 2,
      wp_user_id: 1,
      profile_id: 1,
      reviewer: 1,
      last_editor_id: 1,
      severity_id: 1,
    },
    {
      campaign_id: 1,
      status_id: 2,
      wp_user_id: 1,
      profile_id: 1,
      reviewer: 1,
      last_editor_id: 1,
      severity_id: 3,
    },
    {
      campaign_id: 1,
      status_id: 3,
      wp_user_id: 1,
      profile_id: 1,
      reviewer: 1,
      last_editor_id: 1,
      severity_id: 1,
    },
  ]);
});

describe("GET /campaigns/campaignId/prospect - there are no record", () => {
  it("Should return prospect for each tester with uploaded bugs counters", async () => {
    //we expect that uploaded bugs have just status 2 = approved
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.status).toBe(200);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          bugs: { critical: 1, high: 1, medium: 0, low: 1 },
        }),
        expect.objectContaining({
          bugs: { critical: 0, high: 0, medium: 0, low: 0 },
        }),
      ])
    );
    expect(response.body.items.length).toEqual(2);
  });
  it("Should return prospect with weighted bugs", async () => {
    //we expect that uploaded bugs have just status 2 = approved
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.status).toBe(200);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester: expect.objectContaining({ id: 1 }),
          weightedBugs: 0.9,
          isTopTester: true,
        }),
        expect.objectContaining({
          tester: expect.objectContaining({ id: 2 }),
          weightedBugs: 0,
          isTopTester: false,
        }),
      ])
    );
    expect(response.body.items.length).toEqual(2);
  });

  it("Should not show top tester if is filtered out", async () => {
    //we expect that uploaded bugs have just status 2 = approved
    const response = await request(app)
      .get("/campaigns/1/prospect?filterByInclude[ids]=2")
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.status).toBe(200);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester: expect.objectContaining({ id: 2 }),
          weightedBugs: 0,
          isTopTester: false,
        }),
      ])
    );
    expect(response.body.items.length).toEqual(1);
  });
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

  it("Should return prospect for each tester with uploaded bugs counters", async () => {
    //we expect that uploaded bugs have just status 2 = approved
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.status).toBe(200);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          bugs: { critical: 1, high: 1, medium: 0, low: 1 },
        }),
        expect.objectContaining({
          bugs: { critical: 0, high: 0, medium: 0, low: 0 },
        }),
      ])
    );
    expect(response.body.items.length).toEqual(2);
  });

  it("Should return prospect with weighted bugs", async () => {
    //we expect that uploaded bugs have just status 2 = approved
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.status).toBe(200);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester: expect.objectContaining({ id: 1 }),
          weightedBugs: 0.9,
        }),
        expect.objectContaining({
          tester: expect.objectContaining({ id: 2 }),
          weightedBugs: 0,
        }),
      ])
    );
    expect(response.body.items.length).toEqual(2);
  });
});
