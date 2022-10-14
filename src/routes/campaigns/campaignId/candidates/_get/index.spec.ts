import request from "supertest";
import app from "@src/app";
import Campaigns from "@src/__mocks__/mockedDb/campaign";
import Candidate from "@src/__mocks__/mockedDb/cpHasCandidates";
import Profile from "@src/__mocks__/mockedDb/profile";
import WpUsers from "@src/__mocks__/mockedDb/wp_users";
import Levels from "@src/__mocks__/mockedDb/levelsDefinition";
import UserLevels from "@src/__mocks__/mockedDb/levels";

describe("GET /campaigns/:campaignId/candidates ", () => {
  beforeAll(async () => {
    await Campaigns.insert({ id: 1 });
    await Levels.insert({ id: 10, name: "Bronze" });
    await Levels.insert({ id: 20, name: "Silver" });
    await Levels.insert({ id: 30, name: "Gold" });
    await Profile.insert({ id: 1 });
    await WpUsers.insert({ ID: 1 });
    await Profile.insert({
      id: 4,
      wp_user_id: 5,
      name: "John",
      surname: "Doe",
      total_exp_pts: 100,
    });
    await UserLevels.insert({ id: 1, tester_id: 4, level_id: 10 });
    await WpUsers.insert({ ID: 5 });
    await Profile.insert({
      id: 2,
      wp_user_id: 6,
      name: "Walter",
      surname: "White",
      total_exp_pts: 1000,
    });
    await UserLevels.insert({ id: 2, tester_id: 2, level_id: 20 });
    await WpUsers.insert({ ID: 6 });
    await Profile.insert({
      id: 3,
      wp_user_id: 7,
      name: "Jesse",
      surname: "Pinkman",
      total_exp_pts: 2,
    });
    await WpUsers.insert({ ID: 9 });
    await Profile.insert({
      id: 10,
      wp_user_id: 9,
      name: "Jesse",
      surname: "Pinkman",
      total_exp_pts: 2,
    });
    await UserLevels.insert({ id: 3, tester_id: 3, level_id: 30 });
    await WpUsers.insert({ ID: 7 });
    await Candidate.insert({
      user_id: 5,
      campaign_id: 1,
      accepted: 0,
    });
    await Candidate.insert({
      user_id: 6,
      campaign_id: 1,
      accepted: 0,
    });
    await Candidate.insert({
      user_id: 7,
      campaign_id: 1,
      accepted: 0,
    });
    await Candidate.insert({
      user_id: 9,
      campaign_id: 1,
      accepted: 1,
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
  it("should answer a list of tester name and surnames ", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results.length).toBe(3);
    expect(response.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "John",
          surname: "Doe",
        }),
        expect.objectContaining({
          name: "Walter",
          surname: "White",
        }),
        expect.objectContaining({
          name: "Jesse",
          surname: "Pinkman",
        }),
      ])
    );
  });
  it("should answer a list of experience points ", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results.length).toBe(3);
    expect(response.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          experience: 100,
        }),
        expect.objectContaining({
          experience: 1000,
        }),
        expect.objectContaining({
          experience: 2,
        }),
      ])
    );
  });

  it("should answer a list of levels ", async () => {
    const response = await request(app)
      .get("/campaigns/1/candidates/")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results.length).toBe(3);
    expect(response.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: "Bronze",
        }),
        expect.objectContaining({
          level: "Silver",
        }),
        expect.objectContaining({
          level: "Gold",
        }),
      ])
    );
  });
});
