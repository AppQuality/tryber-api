import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

beforeAll(async () => {
  await tryber.tables.WpAppqEvdCampaign.do().insert({
    id: 1,
    platform_id: 1,
    start_date: "2020-01-01",
    end_date: "2020-01-01",
    title: "This is the title",
    page_preview_id: 1,
    page_manual_id: 1,
    customer_id: 1,
    pm_id: 1,
    project_id: 1,
    customer_title: "",
  });
});
describe("PATCH /campaigns/campaignId/prospect - prospect not delivered", () => {
  it("Should return 403 if logged out", async () => {
    const response = await request(app)
      .patch("/campaigns/1/prospect")
      .send({ status: "done" });
    expect(response.status).toBe(403);
  });

  it("Should return 403 if logged in as not admin user", async () => {
    const response = await request(app)
      .patch("/campaigns/1/prospect")
      .send({ status: "done" })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 400 if campaign does not exists", async () => {
    const response = await request(app)
      .patch("/campaigns/100/prospect")
      .send({ status: "done" })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(400);
  });

  it("Should return 200 if logged in as admin", async () => {
    const response = await request(app)
      .patch("/campaigns/1/prospect")
      .send({ status: "done" })
      .set("Authorization", "Bearer admin");
    console.log(response.body);
    expect(response.status).toBe(200);
  });

  it("Should return 200 if logged in as tester with both olps tester_selection, prospect", async () => {
    const response = await request(app)
      .patch("/campaigns/1/prospect")
      .send({ status: "done" })
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    expect(response.status).toBe(200);
  });
});

describe("PATCH /campaigns/campaignId/prospect - should return 304 if prospect is delivered", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqExpPoints.do().insert({
      tester_id: 1,
      campaign_id: 1,
      activity_id: 1,
      pm_id: 1,
      reason: "[CP1] Super Mario Bros  - Campaign successfully completed",
    });
  });

  afterAll(async () => {
    await tryber.tables.WpAppqExpPoints.do().delete();
  });

  it("Should return 304 if logged in as tester with both olps tester_selection, prospect", async () => {
    const response = await request(app)
      .patch("/campaigns/1/prospect")
      .send({ status: "done" })
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    expect(response.status).toBe(304);
  });

  it("Should return 304 if logged in as admin", async () => {
    const response = await request(app)
      .patch("/campaigns/1/prospect")
      .send({ status: "done" })
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    expect(response.status).toBe(304);
  });
});
