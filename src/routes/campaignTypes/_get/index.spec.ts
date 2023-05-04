import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("GET /campaignTypes", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqCampaignType.do().insert([
      {
        id: 1,
        name: "Campaign Type 1",
        category_id: 1,
      },
      {
        id: 2,
        name: "Campaign Type 2",
        category_id: 1,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqCampaignType.do().delete();
  });

  it("Should answer 403 if not logged in", () => {
    return request(app).get("/campaignTypes").expect(403);
  });
  it("Should answer 403 if logged in without permissions", async () => {
    const response = await request(app)
      .get("/campaignTypes")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged as user with full access on campaigns", async () => {
    const response = await request(app)
      .get("/campaignTypes")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
  });
  it("Should answer 200 if logged as user with access to some campaigns", async () => {
    const response = await request(app)
      .get("/campaignTypes")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,2]}');
    expect(response.status).toBe(200);
  });

  it("Should answer with a list of types when user has full access", async () => {
    const response = await request(app)
      .get("/campaignTypes")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body).toEqual([
      {
        id: 1,
        name: "Campaign Type 1",
      },
      {
        id: 2,
        name: "Campaign Type 2",
      },
    ]);
  });
  it("Should answer with a list of types when user has partial access to campaign", async () => {
    const response = await request(app)
      .get("/campaignTypes")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,2]}');
    expect(response.body).toEqual([
      {
        id: 1,
        name: "Campaign Type 1",
      },
      {
        id: 2,
        name: "Campaign Type 2",
      },
    ]);
  });
});
