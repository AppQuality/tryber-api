import Campaigns from "@src/__mocks__/mockedDb/campaign";
import PageAccess from "@src/__mocks__/mockedDb/pageAccess";
import TesterDevice from "@src/__mocks__/mockedDb/testerDevice";
import Os from "@src/__mocks__/mockedDb/deviceOs";
import Platform from "@src/__mocks__/mockedDb/devicePlatform";
import app from "@src/app";
import request from "supertest";

const yesterday = new Date().setDate(new Date().getDate() - 1);
const campaign2 = {
  id: 2,
  title: "Campaign with the unavailable candidature",
  start_date: new Date(yesterday).toISOString().split("T")[0],
  page_preview_id: 2,
  is_public: 1 as 1,
};
const campaign3 = {
  id: 3,
  title: "This is the Campaign title",
  start_date: new Date().toISOString().split("T")[0],
  page_preview_id: 3,
  is_public: 3 as 3,
};

describe("GET /users/me/campaigns/CP_ID/compatible_devices", () => {
  beforeEach(async () => {
    await Campaigns.insert({
      id: 1,
      title: "This is the Campaign title",
      start_date: new Date().toISOString().split("T")[0],
      page_preview_id: 1,
      is_public: 1 as 1,
      os: "1,2",
    });
    await Campaigns.insert(campaign2);
    await Campaigns.insert(campaign3);
    await PageAccess.insert({ id: 1, tester_id: 1, view_id: 1 });
    await PageAccess.insert({ id: 2, tester_id: 1, view_id: 2 });
    await TesterDevice.insert({
      id: 1,
      id_profile: 1,
      manufacturer: "Manufacturer",
      model: "Model",
      form_factor: "Smartphone",
      platform_id: 1,
      os_version_id: 1,
      enabled: 1,
      source_id: 1,
    });
    await Platform.insert({
      id: 1,
      name: "Platform 1",
    });
    await Os.insert({
      id: 1,
      display_name: "Version 1",
    });
    await TesterDevice.insert({
      id: 2,
      id_profile: 1,
      platform_id: 2,
      form_factor: "PC",
      pc_type: "Desktop",
      os_version_id: 2,
      enabled: 1,
      source_id: 2,
    });
    await Platform.insert({
      id: 2,
      name: "Platform 2",
    });
    await Os.insert({
      id: 2,
      display_name: "Version 2",
    });
    await TesterDevice.insert({
      id: 3,
      id_profile: 1,
      platform_id: 1,
      form_factor: "Smartphone",
      os_version_id: 1,
      enabled: 0,
      source_id: 3,
    });
  });
  afterEach(async () => {
    await Campaigns.clear();
    await PageAccess.clear();
    await TesterDevice.clear();
    await Os.clear();
    await Platform.clear();
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get(
      "/users/me/campaigns/1/compatible_devices"
    );
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged in tryber", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/compatible_devices")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should return 403 if candidature is not available (after start_date).", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/2/compatible_devices")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty(
      "message",
      "You cannot access to this campaign"
    );
  });
  it("Should return 403 if User is not in SMALL_GROUP and is not LOGGED_USER", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/3/compatible_devices")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty(
      "message",
      "You cannot access to this campaign"
    );
  });
  it("Should return 403 if campaign does not exists", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/69/compatible_devices")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty(
      "message",
      "You cannot access to this campaign"
    );
  });

  it("Should return a list of devices", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/compatible_devices")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        type: "Smartphone",
        id: 1,
        device: {
          manufacturer: "Manufacturer",
          model: "Model",
          id: 1,
        },
        operating_system: {
          id: 1,
          platform: "Platform 1",
          version: "Version 1 (1.0)",
        },
      },
      {
        type: "PC",
        id: 2,
        device: {
          pc_type: "Desktop",
        },
        operating_system: {
          id: 2,
          platform: "Platform 2",
          version: "Version 2 (1.0)",
        },
      },
    ]);
  });
});
describe("GET /users/me/campaigns/CP_ID/compatible_devices - user has not compatible devices", () => {
  beforeEach(async () => {
    await Campaigns.insert({
      id: 1,
      title: "This is the Campaign title",
      start_date: new Date().toISOString().split("T")[0],
      page_preview_id: 1,
      is_public: 1 as 1,
      os: "1,2",
    });
    await PageAccess.insert({ id: 1, tester_id: 1, view_id: 1 });
    await TesterDevice.insert({
      id_profile: 1,
      platform_id: 4,
      form_factor: "Smart-tv",
      os_version_id: 1,
      source_id: 1,
    });
    await Os.insert({
      id: 1,
      display_name: "Version 1",
    });
  });
  afterEach(async () => {
    await Campaigns.clear();
    await PageAccess.clear();
    await TesterDevice.clear();
  });

  it("Should answer 404 if user has not compatible devices", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/compatible_devices")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty(
      "message",
      "There are no compatible devices"
    );
  });
});
