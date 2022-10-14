import request from "supertest";
import app from "@src/app";
import Campaigns from "@src/__mocks__/mockedDb/campaign";
import Candidate from "@src/__mocks__/mockedDb/cpHasCandidates";
import Profile from "@src/__mocks__/mockedDb/profile";
import WpUsers from "@src/__mocks__/mockedDb/wp_users";

describe("GET /campaigns/:campaignId/candidates ", () => {
  beforeAll(async () => {
    await Campaigns.insert({ id: 1 });
    await Profile.insert({ id: 1 });
    await WpUsers.insert({ ID: 1 });
    await Profile.insert({ id: 4, wp_user_id: 5 });
    await WpUsers.insert({ ID: 5 });
    await Profile.insert({ id: 2, wp_user_id: 6 });
    await WpUsers.insert({ ID: 6 });
    await Profile.insert({ id: 3, wp_user_id: 7 });
    await WpUsers.insert({ ID: 7 });
    await Candidate.insert({
      user_id: 5,
      campaign_id: 1,
    });
    await Candidate.insert({
      user_id: 6,
      campaign_id: 1,
    });
    await Candidate.insert({
      user_id: 7,
      campaign_id: 1,
    });
  });
  afterAll(async () => {
    await Campaigns.clear();
  });
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
  it("should answer 404 if campaign does not exists", async () => {
    const response = await request(app)
      .get("/campaigns/100/candidates/")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.status).toBe(404);
  });
  it("should answer a list of tester ids ", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results.length).toBe(3);
    expect(response.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 4,
        }),
        expect.objectContaining({
          id: 2,
        }),

        expect.objectContaining({
          id: 3,
        }),
      ])
    );
  });
});
