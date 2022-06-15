import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import Campaigns from "@src/__mocks__/mockedDb/campaign";
import Candidature from "@src/__mocks__/mockedDb/cp_has_candidates";
import { data as testerData } from "@src/__mocks__/mockedDb/profile";
import { data as wpUsersData } from "@src/__mocks__/mockedDb/wp_users";
import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import request from "supertest";

describe("POST /campaigns/{campaignId}/candidates", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await Campaigns.insert();
      await testerData.testerWithBooty();
      await wpUsersData.basicUser();
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await Campaigns.clear();
      await testerData.drop();
      await wpUsersData.drop();
      await Candidature.clear();
      resolve(null);
    });
  });
  it("Should return 403 if user is not admin", async () => {
    const response = await request(app)
      .post("/campaigns/1/candidates")
      .send({ tester_id: 1 })
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should return 200 if user is admin and campaignId exist", async () => {
    const response = await request(app)
      .post("/campaigns/1/candidates")
      .send({ tester_id: 1 })
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });
  it("Should return 404 if tester_id does not exist", async () => {
    const response = await request(app)
      .post("/campaigns/1/candidates")
      .send({ tester_id: 69 })
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(404);
  });

  it("Should return 403 if tester is already candidate on campaign", async () => {
    await Candidature.insert({ user_id: 1, campaign_id: 1 });
    const responseJustCandidate = await request(app)
      .post("/campaigns/1/candidates")
      .send({ tester_id: 1 })
      .set("authorization", "Bearer admin");
    expect(responseJustCandidate.status).toBe(403);
  });

  it("Should candidate the user on success", async () => {
    const beforeCandidature = await sqlite3.get(`
      SELECT c.accepted,c.results FROM 
      wp_crowd_appq_has_candidate c
      JOIN wp_appq_evd_profile t ON (t.wp_user_id = c.user_id)
      WHERE t.id = 1 AND c.campaign_id = 1
    `);
    expect(beforeCandidature).toBe(undefined);
    await request(app)
      .post("/campaigns/1/candidates")
      .send({ tester_id: 1 })
      .set("authorization", "Bearer admin");
    const afterCandidature = await sqlite3.get(`
      SELECT c.accepted,c.results FROM 
      wp_crowd_appq_has_candidate c
      JOIN wp_appq_evd_profile t ON (t.wp_user_id = c.user_id)
      WHERE t.id = 1 AND c.campaign_id = 1
    `);
    expect(afterCandidature).toEqual({
      accepted: 1,
      results: 0,
    });
  });
  it("Should return the candidature on success", async () => {
    const response = await request(app)
      .post("/campaigns/1/candidates")
      .send({ tester_id: 1 })
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      tester_id: 1,
      campaign_id: 1,
      accepted: true,
      status: "ready",
      device: "any",
    });
  });
});
