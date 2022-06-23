import app from "@src/app";
import Campaigns from "@src/__mocks__/mockedDb/campaign";
import Candidature from "@src/__mocks__/mockedDb/cp_has_candidates";
import CustomSeverities from "@src/__mocks__/mockedDb/customSeverities";
import { data as profileData } from "@src/__mocks__/mockedDb/profile";
import Severities from "@src/__mocks__/mockedDb/severities";
import WpOptions from "@src/__mocks__/mockedDb/wp_options";
import { data as wpUserData } from "@src/__mocks__/mockedDb/wp_users";
import request from "supertest";

describe("Route GET /users/me/campaigns/{campaignId}/", () => {
  beforeAll(async () => {
    await profileData.basicTester();
    await wpUserData.basicUser();
    await Candidature.insert({ campaign_id: 1, user_id: 1 });
    await Severities.insert({ id: 1, name: "Low" });
    await Severities.insert({ id: 2, name: "Medium" });
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
  });
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
    });
  });
});

describe("Route GET /users/me/campaigns/{campaignId}/ - custom severities set", () => {
  beforeAll(async () => {
    await profileData.basicTester();
    await wpUserData.basicUser();
    await Candidature.insert({ campaign_id: 1, user_id: 1 });
    await Severities.insert({ id: 1, name: "Low" });
    await Severities.insert({ id: 2, name: "Medium" });
    await CustomSeverities.insert({ campaign_id: 1, bug_severity_id: 1 });
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
    await CustomSeverities.clear();
  });
  it("Should return only selected severities", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1")
      .set("Authorization", "Bearer tester");
    expect(response.body).toMatchObject({
      id: 1,
      title: "My campaign",
      minimumMedia: 4,
      hasBugForm: true,
      bugSeverity: { valid: ["LOW"], invalid: ["MEDIUM"] },
    });
  });
});
