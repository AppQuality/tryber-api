import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

beforeAll(async () => {
  await tryber.tables.WpAppqEvdProfile.do().insert([
    {
      id: 1,
      name: "John",
      surname: "Doe",
      wp_user_id: 1,
      email: "",
      employment_id: 1,
      education_id: 1,
    },
    {
      id: 2,
      name: "John",
      surname: "Doe",
      wp_user_id: 2,
      email: "",
      employment_id: 1,
      education_id: 1,
    },
  ]);
  await tryber.tables.WpUsers.do().insert([{ ID: 1 }, { ID: 2 }]);
  await tryber.tables.WpAppqEvdCampaign.do().insert({
    id: 1,
    platform_id: 1,
    start_date: "2020-01-01",
    end_date: "2020-01-01",
    title: "This is the title",
    page_preview_id: 1,
    page_manual_id: 1,
    customer_id: 1,
    pm_id: 1,
    project_id: 1,
    customer_title: "",
  });
  await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
    {
      user_id: 1,
      campaign_id: 1,
      accepted: 1,
    },
    {
      user_id: 2,
      campaign_id: 1,
      accepted: 1,
    },
  ]);
});

describe("GET /campaigns/campaignId/stats", () => {
  it("Should return 403 if logged out", async () => {
    const response = await request(app).get("/campaigns/1/stats");
    expect(response.status).toBe(403);
  });

  it("Should return 403 if logged in as not admin user", async () => {
    const response = await request(app)
      .get("/campaigns/1/stats")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 200 if logged in as admin", async () => {
    const response = await request(app)
      .get("/campaigns/1/stats")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should return selected testers for a campaign", async () => {
    const response = await request(app)
      .get("/campaigns/1/stats")
      .set("Authorization", "Bearer admin");
    expect(response.body).toEqual(
      expect.objectContaining({
        selected: 2,
      })
    );
  });
});
