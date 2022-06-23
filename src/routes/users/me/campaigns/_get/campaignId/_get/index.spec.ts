import app from "@src/app";
import request from "supertest";

import Candidature from "@src/__mocks__/mockedDb/cp_has_candidates";
import { data as profileData } from "@src/__mocks__/mockedDb/profile";
import WpOptions from "@src/__mocks__/mockedDb/wp_options";
import { data as wpUserData } from "@src/__mocks__/mockedDb/wp_users";

describe("Route GET /users/me/campaigns/{campaignId}/", () => {
  beforeAll(async () => {
    await profileData.basicTester();
    await wpUserData.basicUser();
    await Candidature.insert({ campaign_id: 1, user_id: 1 });
  });
  afterAll(async () => {
    await wpUserData.drop();
    await profileData.drop();
    await WpOptions.clear();
    await Candidature.clear();
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
});
