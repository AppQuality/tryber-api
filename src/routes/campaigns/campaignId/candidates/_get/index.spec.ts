import request from "supertest";
import app from "@src/app";
describe("GET /campaigns/:campaignId/candidates ", () => {
  beforeAll(async () => {});
  afterAll(async () => {});
  it("should answer 403 if user is not logged in ", async () => {
    const response = await request(app).get("/campaigns/1/candidates");

    expect(response.status).toBe(403);
  });
  it("should answer 403 if user has not olp appq_tester_selection ", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/")
      .set("authorization", `Bearer tester`);
    expect(response.status).toBe(403);
  });
  it("should answer 200 if user has olp appq_tester_selection ", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.status).toBe(200);
  });
});
