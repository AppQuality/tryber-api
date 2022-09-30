import Campaigns from "@src/__mocks__/mockedDb/campaign";
import PageAccess from "@src/__mocks__/mockedDb/pageAccess";
import { data as profileData } from "@src/__mocks__/mockedDb/profile";
import app from "@src/app";
import request from "supertest";

const yesterday = new Date().setDate(new Date().getDate() - 1);
const campaign1 = {
  id: 1,
  title: "This is the Campaign title",
  start_date: new Date().toISOString().split("T")[0],
  page_preview_id: 1,
  is_public: 1 as 1,
};
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

describe("GET /users/me/campaigns/CP_ID/available_devices", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await profileData.basicTester();
      await Campaigns.insert(campaign1);
      await Campaigns.insert(campaign2);
      await Campaigns.insert(campaign3);
      await PageAccess.insert({ id: 1, tester_id: 1, view_id: 1 });
      await PageAccess.insert({ id: 2, tester_id: 1, view_id: 2 });

      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await profileData.drop();
      await Campaigns.clear();
      await PageAccess.clear();
      resolve(null);
    });
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get(
      "/users/me/campaigns/1/available_devices"
    );
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged in tryber", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/available_devices")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should return 403 if candidature is not available (after start_date).", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/2/available_devices")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty(
      "message",
      "You cannot access to this campaign"
    );
  });
  it("Should return 403 if User is not in SMALL_GROUP and is not LOGGED_USER", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/3/available_devices")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty(
      "message",
      "You cannot access to this campaign"
    );
  });
});
