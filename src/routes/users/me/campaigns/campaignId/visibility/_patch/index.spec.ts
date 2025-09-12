import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

// Setta is_public = 4 se target o 0 se internal.

describe("Route PATCH /campaigns/:id/visibility", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqProject.do().insert({
      id: 1,
      display_name: "Test Project",
      customer_id: 1,
      edited_by: 1,
    });
  });

  afterAll(async () => {
    await tryber.tables.WpAppqProject.do().delete();
  });
  beforeEach(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 1,
      project_id: 1,
      title: "Test Campaign",
      customer_title: "Test Customer Campaign",
      start_date: "2019-08-24T14:15:22Z",
      end_date: "2019-08-24T14:15:22Z",
      platform_id: 0,
      page_manual_id: 0,
      page_preview_id: 0,
      pm_id: 1,
      customer_id: 0,
    });
  });
  afterEach(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).patch("/campaigns/1/visibility");
    expect(response.status).toBe(403);
  });

  it("Should answer 403 if campaign does not exists", async () => {
    const response = await request(app).patch("/campaigns/10/visibility");
    expect(response.status).toBe(403);
  });

  /* it("Should answer 403 if not admin", async () => {
    const response = await request(app)
      .patch("/campaigns/1/visibility")
      .send({ type: "internal" })
      .set("Authorization", "Bearer tester");

    console.log(response.body);

    expect(response.status).toBe(403);
  }); */

  it("Should answer 400 if type does not exists", async () => {
    const response = await request(app)
      .patch("/campaigns/1/visibility")
      .set("authorization", "Bearer admin")
      .send({ type: "invalid" });
    expect(response.status).toBe(400);
  });

  it("Should answer 400 if body parameter is not valid", async () => {
    const response = await request(app)
      .patch("/campaigns/1/visibility")
      .set("authorization", "Bearer admin")
      .send({ invalid: "internal" });
    expect(response.status).toBe(400);
  });

  it("Should answer 400 if body is empty", async () => {
    const response = await request(app)
      .patch("/campaigns/1/visibility")
      .set("authorization", "Bearer admin")
      .send({});
    expect(response.status).toBe(400);
  });

  it("Should answer 200 if admin", async () => {
    const response = await request(app)
      .patch("/campaigns/1/visibility")
      .set("authorization", "Bearer admin")
      .send({ type: "internal" });
    expect(response.status).toBe(200);
  });

  it("Should answer 200 if user has access to the campaign", async () => {
    const response = await request(app)
      .patch("/campaigns/1/visibility")
      .send({ type: "internal" })
      .set("authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(200);
  });

  it("Should answer 200 if user has access to the campaign", async () => {
    const response = await request(app)
      .patch("/campaigns/1/visibility")
      .send({ type: "internal" })
      .set("authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(200);
  });
});
