import { data as campaignData } from "@src/__mocks__/mockedDb/campaign";
import app from "@src/app";
import request from "supertest";

describe("Route POST a bug to a specific campaign", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await campaignData.basicCampaign();

      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await campaignData.drop();

      resolve(null);
    });
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).post("/users/me/campaigns/1/bugs");
    console.log(response.body);
    expect(response.status).toBe(403);
  });
  it("Should answer 404 if campaign does not exist", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/2/bugs")
      .set("authorization", "Bearer tester")
      .send({
        title: "Camapign Title",
        description: "Camapign Description",
        expected: "The expected to reproduce the bug",
        current: "Current case",
        severity: "LOW",
        replicability: "ONCE",
        type: "CRASH",
        notes: "The bug notes",
        usecase: 1,
        device: 0,
        media: ["the media1 url"],
      });
    console.log(response.body);
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      element: "post a bug",
      id: 0,
      message: "CampaignId 2, does not exists.",
    });
  });
});
