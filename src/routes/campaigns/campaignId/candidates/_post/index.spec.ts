import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import {
  data as cpData,
  table as cpTable,
} from "@src/__mocks__/mockedDb/campaign";
import {
  data as candidatesData,
  table as candidatesTable,
} from "@src/__mocks__/mockedDb/cp_has_candidates";
import {
  data as testerData,
  table as testerTable,
} from "@src/__mocks__/mockedDb/profile";
import {
  data as wpUsersData,
  table as wpUsersTable,
} from "@src/__mocks__/mockedDb/wp_users";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");
describe("POST /campaigns/{campaignId}/candidates", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await cpTable.create();
      await cpData.basicCampaign();
      await testerTable.create();
      await testerData.testerWithBooty();
      await wpUsersTable.create();
      await wpUsersData.basicUser();
      await candidatesTable.create();
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await cpTable.drop();
      await testerTable.drop();
      await wpUsersTable.drop();
      await candidatesTable.drop();
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
    await candidatesData.candidate1({ user_id: 1, campaign_id: 1 });
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
