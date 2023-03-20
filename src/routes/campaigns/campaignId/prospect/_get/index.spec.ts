import request from "supertest";
import app from "@src/app";
import useCampaign from "./useCampaign";
import { tryber } from "@src/features/database";

useCampaign();
describe("GET /campaigns/campaignId/prospect", () => {
  it("Should return 403 if logged out", async () => {
    const response = await request(app).get("/campaigns/1/prospect");
    expect(response.status).toBe(403);
  });

  it("Should return 403 if logged in as not admin user", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 400 if campaign does not exists", async () => {
    const response = await request(app)
      .get("/campaigns/100/prospect")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(400);
  });

  it("Should return 200 if logged in as admin", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should return 200 if logged in as tester with both olps tester_selection, prospect", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    expect(response.status).toBe(200);
  });

  it("Should return an item for each selected tester", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toHaveLength(1);
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

  afterAll(async () => {
    await tryber.tables.WpAppqProspectPayout.do().delete();
  });

  it("Should return 200 ", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    expect(response.status).toBe(200);
  });

  // it("Should return prospect if already exist", async () => {
  //   const response = await request(app)
  //     .get("/campaigns/1/prospect")
  //     .set(
  //       "Authorization",
  //       'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
  //     );
  //   expect(response.body.items).toEqual(
  //     expect.arrayContaining([
  //       expect.objectContaining({
  //         tester: { id: 1, name: "John", surname: "Doe" },
  //         bugs: { critical: 1, high: 0, low: 1, medium: 0 },
  //         usecases: { completed: 2, required: 2 },
  //         note: "This is the notes",
  //         experience: { completion: 100, extra: 69 },
  //         payout: { bug: 5, completion: 25, extra: 9, refund: 1 },
  //         // status: "pending",
  //       }),
  //       expect.objectContaining({
  //         tester: { id: 2, name: "John", surname: "Doe" },
  //         bugs: { critical: 0, high: 0, low: 0, medium: 0 },
  //         usecases: { completed: 0, required: 2 },
  //         note: "",
  //         experience: { completion: 0, extra: 0 },
  //         payout: { bug: 0, completion: 0, extra: 0, refund: 0 },
  //         // status: "pending",
  //       }),
  //     ])
  //   );
  //   expect(response.body.items.length).toEqual(2);
  // });
});
