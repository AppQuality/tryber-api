import app from "@src/app";
import BugTypes from "@src/__mocks__/mockedDb/bugTypes";
import Campaigns from "@src/__mocks__/mockedDb/campaign";
import Candidature from "@src/__mocks__/mockedDb/cp_has_candidates";
import CustomBugTypes from "@src/__mocks__/mockedDb/customBugTypes";
import CustomReplicabilities from "@src/__mocks__/mockedDb/customReplicabilities";
import CustomSeverities from "@src/__mocks__/mockedDb/customSeverities";
import { data as profileData } from "@src/__mocks__/mockedDb/profile";
import Replicabilities from "@src/__mocks__/mockedDb/replicabilities";
import Severities from "@src/__mocks__/mockedDb/severities";
import WpOptions from "@src/__mocks__/mockedDb/wp_options";
import { data as wpUserData } from "@src/__mocks__/mockedDb/wp_users";
import request from "supertest";

beforeAll(async () => {
  await profileData.basicTester();
  await wpUserData.basicUser();
  await Candidature.insert({ campaign_id: 1, user_id: 1 });
  await Severities.insert({ id: 1, name: "Low" });
  await Severities.insert({ id: 2, name: "Medium" });
  await BugTypes.insert({ id: 1, name: "Typo" });
  await BugTypes.insert({ id: 2, name: "Crash" });
  await Replicabilities.insert({ id: 1, name: "Once" });
  await Replicabilities.insert({ id: 2, name: "Always" });
  await Campaigns.insert({
    id: 1,
    title: "My campaign",
    min_allowed_media: 4,
    campaign_type: 0,
  });
});
afterAll(async () => {
  await wpUserData.drop();
  await profileData.drop();
  await WpOptions.clear();
  await Candidature.clear();
  await Severities.clear();
  await Campaigns.clear();
  await BugTypes.clear();
  await Replicabilities.clear();
});
describe("Route GET /users/me/campaigns/{campaignId}/", () => {
  it("Should return 403 if user is not logged in", () => {
    return request(app).get("/users/me/campaigns/1").expect(403);
  });
  it("Should return 404 if user is logged in but not selected", () => {
    return request(app)
      .get("/users/me/campaigns/100")
      .set("Authorization", "Bearer tester")
      .expect(404);
  });
  it("Should return 200 if user is logged and selected", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should return campaign data if user is logged and selected", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1")
      .set("Authorization", "Bearer tester");
    expect(response.body).toMatchObject({
      id: 1,
      title: "My campaign",
      minimumMedia: 4,
      hasBugForm: true,
      bugSeverity: { valid: ["LOW", "MEDIUM"], invalid: [] },
      bugTypes: { valid: ["TYPO", "CRASH"], invalid: [] },
      bugReplicability: { valid: ["ONCE", "ALWAYS"], invalid: [] },
    });
  });
});

describe("Route GET /users/me/campaigns/{campaignId}/ - custom severities set", () => {
  beforeAll(async () => {
    await CustomSeverities.insert({ campaign_id: 1, bug_severity_id: 1 });
  });
  afterAll(async () => {
    await CustomSeverities.clear();
  });
  it("Should return only selected severities", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1")
      .set("Authorization", "Bearer tester");
    expect(response.body).toMatchObject({
      bugSeverity: { valid: ["LOW"], invalid: ["MEDIUM"] },
    });
  });
});

describe("Route GET /users/me/campaigns/{campaignId}/ - custom bug types set", () => {
  beforeAll(async () => {
    await CustomBugTypes.insert({ campaign_id: 1, bug_type_id: 1 });
  });
  afterAll(async () => {
    await CustomBugTypes.clear();
  });
  it("Should return only selected bug types", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1")
      .set("Authorization", "Bearer tester");
    expect(response.body).toMatchObject({
      bugTypes: { valid: ["TYPO"], invalid: ["CRASH"] },
    });
  });
});

describe("Route GET /users/me/campaigns/{campaignId}/ - custom replicabilities set", () => {
  beforeAll(async () => {
    await CustomReplicabilities.insert({
      campaign_id: 1,
      bug_replicability_id: 1,
    });
  });
  afterAll(async () => {
    await CustomReplicabilities.clear();
  });
  it("Should return only selected bug types", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1")
      .set("Authorization", "Bearer tester");
    expect(response.body).toMatchObject({
      bugReplicability: { valid: ["ONCE"], invalid: ["ALWAYS"] },
    });
  });
});
