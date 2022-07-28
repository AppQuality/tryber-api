import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import Campaigns from "@src/__mocks__/mockedDb/campaign";
import Candidature from "@src/__mocks__/mockedDb/cpHasCandidates";
import { data as testerData } from "@src/__mocks__/mockedDb/profile";
import { data as wpUsersData } from "@src/__mocks__/mockedDb/wp_users";
import DeviceOs from "@src/__mocks__/mockedDb/deviceOs";
import DevicePlatform from "@src/__mocks__/mockedDb/devicePlatform";
import TesterDevice from "@src/__mocks__/mockedDb/testerDevice";
import request from "supertest";

describe("POST /campaigns/{campaignId}/candidates", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await testerData.testerWithBooty();
      await wpUsersData.basicUser();
      await Campaigns.insert();
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await testerData.drop();
      await wpUsersData.drop();
      await Campaigns.clear();
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
      SELECT c.accepted,c.results, c.selected_device FROM 
      wp_crowd_appq_has_candidate c
      JOIN wp_appq_evd_profile t ON (t.wp_user_id = c.user_id)
      WHERE t.id = 1 AND c.campaign_id = 1
    `);
    expect(afterCandidature).toEqual({
      accepted: 1,
      results: 0,
      selected_device: 0,
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

describe("POST /campaigns/{campaignId}/candidates?device=random when user has not devices", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await testerData.testerWithBooty();
      await wpUsersData.basicUser();
      await Campaigns.insert();
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await testerData.drop();
      await wpUsersData.drop();
      await Campaigns.clear();
      await Candidature.clear();
      resolve(null);
    });
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
      .post("/campaigns/1/candidates?device=random")
      .send({ tester_id: 1 })
      .set("authorization", "Bearer admin");

    const afterCandidature = await sqlite3.get(`
      SELECT c.accepted,c.results, c.selected_device FROM 
      wp_crowd_appq_has_candidate c
      JOIN wp_appq_evd_profile t ON (t.wp_user_id = c.user_id)
      WHERE t.id = 1 AND c.campaign_id = 1
    `);

    expect(afterCandidature).toEqual({
      accepted: 1,
      results: 0,
      selected_device: 0,
    });
  });
  it("Should return the candidature on success", async () => {
    const response = await request(app)
      .post("/campaigns/1/candidates?device=random")
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

describe("POST /campaigns/{campaignId}/candidates?device=random when user has two devices", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await testerData.testerWithBooty();
      await wpUsersData.basicUser();
      await Campaigns.insert();
      await DeviceOs.insert({ id: 1, display_name: "Linux" });
      await DevicePlatform.insert({ id: 1, name: "Platform 1" });
      await TesterDevice.insert({
        id: 1,
        id_profile: 1,
        enabled: 1,
        form_factor: "PC",
        pc_type: "Laptop",
        os_version_id: 1,
        platform_id: 1,
      });
      await TesterDevice.insert({
        id: 2,
        id_profile: 1,
        enabled: 1,
        form_factor: "PC",
        pc_type: "Server",
        os_version_id: 1,
        platform_id: 1,
      });
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await testerData.drop();
      await wpUsersData.drop();
      await Campaigns.clear();
      await Candidature.clear();
      await TesterDevice.clear();
      await DeviceOs.clear();
      await DevicePlatform.clear();
      resolve(null);
    });
  });
  it("Should candidate the user on success", async () => {
    const beforeCandidature = await sqlite3.get(`
      SELECT c.accepted,c.results FROM 
      wp_crowd_appq_has_candidate c
      JOIN wp_appq_evd_profile t ON (t.wp_user_id = c.user_id)
      WHERE t.id = 1 AND c.campaign_id = 1
    `);

    const testerDevices = await sqlite3.all(`
    SELECT * FROM wp_crowd_appq_device WHERE id_profile = 1;
  `);

    expect(beforeCandidature).toBe(undefined);
    await request(app)
      .post("/campaigns/1/candidates?device=random")
      .send({ tester_id: 1 })
      .set("authorization", "Bearer admin");

    const afterCandidature = await sqlite3.get(`
      SELECT c.accepted,c.results, c.selected_device FROM 
      wp_crowd_appq_has_candidate c
      JOIN wp_appq_evd_profile t ON (t.wp_user_id = c.user_id)
      WHERE t.id = 1 AND c.campaign_id = 1
    `);
    console.log(afterCandidature);
    expect([
      {
        accepted: 1,
        results: 0,
        selected_device: 1,
      },
      {
        accepted: 1,
        results: 0,
        selected_device: 2,
      },
    ]).toContainEqual(afterCandidature);
  });
  it("Should return the candidature on success with the first available device as the selected device", async () => {
    const response = await request(app)
      .post("/campaigns/1/candidates?device=random")
      .send({ tester_id: 1 })
      .set("authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect([
      {
        id: 1,
        type: "PC",
        device: { pc_type: "Laptop" },
        operating_system: {
          id: 1,
          platform: "Platform 1",
          version: "Linux (1.0)",
        },
      },
      {
        id: 2,
        type: "PC",
        device: { pc_type: "Server" },
        operating_system: {
          id: 1,
          platform: "Platform 1",
          version: "Linux (1.0)",
        },
      },
    ]).toContainEqual(response.body.device);
  });
});
