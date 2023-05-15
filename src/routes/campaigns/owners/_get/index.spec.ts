import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
const campaign = {
  title: "Campaign 1",
  project_id: 1,
  customer_title: "Customer 1",
  customer_id: 1,
  platform_id: 1,
  start_date: "2020-01-01",
  end_date: "2020-01-01",
  page_manual_id: 1,
  page_preview_id: 1,
};
const profile = {
  email: "",
  education_id: 1,
  employment_id: 1,
};
describe("GET /campaigns/owners", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        ...campaign,
        id: 1,
        pm_id: 1,
      },
      {
        ...campaign,
        id: 2,
        pm_id: 2,
      },
      {
        ...campaign,
        id: 3,
        pm_id: 3,
      },
    ]);
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        ...profile,
        id: 1,
        wp_user_id: 1,
        name: "User",
        surname: "One",
      },
      {
        ...profile,
        id: 2,
        wp_user_id: 2,
        name: "User",
        surname: "Two",
      },
      {
        ...profile,
        id: 3,
        wp_user_id: 3,
        name: "Deleted User",
        surname: "",
      },
    ]);
  });
  it("Should return 403 if not logged in", () => {
    return request(app).get("/campaigns/owners").expect(403);
  });

  it("Should return 403 if logged in as tester", () => {
    return request(app)
      .get("/campaigns/owners")
      .set("Authorization", "Bearer tester")
      .expect(403);
  });
  it("Should return 200 if logged in as tester with campaign olp", () => {
    return request(app)
      .get("/campaigns/owners")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}')
      .expect(200);
  });
  it("Should return 200 if logged in as admin", () => {
    return request(app)
      .get("/campaigns/owners")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}')
      .expect(200);
  });

  it("Should return a list of all campaign owners (w/o deleted users)", async () => {
    const response = await request(app)
      .get("/campaigns/owners")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');

    expect(response.body).toHaveLength(2);
    expect(response.body).toEqual(
      expect.arrayContaining([
        { id: 1, name: "User", surname: "One" },
        { id: 2, name: "User", surname: "Two" },
      ])
    );
  });
  it("Should return a partial list of owners if not full olp", async () => {
    const response = await request(app)
      .get("/campaigns/owners")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');

    expect(response.body).toHaveLength(1);
    expect(response.body).toEqual(
      expect.arrayContaining([{ id: 1, name: "User", surname: "One" }])
    );
  });
});
