import app from "@src/app";
import request from "supertest";
import PreselectionForm from "@src/__mocks__/mockedDb/preselectionForm";
import Campaign from "@src/__mocks__/mockedDb/campaign";

describe("GET /campaigns/{campaignId}/forms/{formId}", () => {
  beforeAll(() => {
    Campaign.insert({ id: 1 });
    PreselectionForm.insert({ id: 1, campaign_id: 1 });
  });
  afterAll(() => {
    PreselectionForm.clear();
  });
  it("Should return 403 if user is not admin", async () => {
    const response = await request(app)
      .get("/campaigns/1/forms/1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 200 if user is admin", async () => {
    const response = await request(app)
      .get("/campaigns/1/forms/1")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should return 404 if form does not exists", async () => {
    const response = await request(app)
      .get("/campaigns/1/forms/2")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(404);
  });

  it("Should return 404 if campaign does not exists", async () => {
    const response = await request(app)
      .get("/campaigns/2/forms/1")
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(404);
  });
});
