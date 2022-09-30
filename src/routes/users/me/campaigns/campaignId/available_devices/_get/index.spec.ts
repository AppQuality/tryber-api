import Campaigns from "@src/__mocks__/mockedDb/campaign";
import { data as profileData } from "@src/__mocks__/mockedDb/profile";
import app from "@src/app";
import request from "supertest";

const yesterday = new Date().setDate(new Date().getDate() - 1);
const campaign1 = {
  id: 1,
  title: "This is the Campaign title",
  start_date: new Date().toISOString().split("T")[0],
};
const campaign2 = {
  id: 2,
  title: "Campaign with the unavailable candidature",
  start_date: new Date(yesterday).toISOString().split("T")[0],
};

describe("GET /users/me/campaigns/CP_ID/available_devices", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await profileData.basicTester();
      await Campaigns.insert(campaign1);
      await Campaigns.insert(campaign2);

      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await profileData.drop();
      await Campaigns.clear();

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
    console.log("available DEVICE", response.body);
    expect(response.status).toBe(403);
  });
});
