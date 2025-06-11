import app from "@src/app";
import { tryber } from "@src/features/database";
import resolvePermalinks from "@src/features/wp/resolvePermalinks";
import request from "supertest";

jest.mock("@src/features/wp/resolvePermalinks");
describe("GET /users/me/campaigns - visibility", () => {
  beforeAll(async () => {
    (resolvePermalinks as jest.Mock).mockImplementation(() => {
      return {
        1: { en: "en/test1", it: "it/test1", es: "es/test1", fr: "fr/test1" },
        2: { en: "en/test2", it: "it/test2", es: "es/test2", fr: "fr/test2" },
      };
    });
    await tryber.seeds().campaign_statuses();
    const profile = {
      name: "jhon",
      surname: "doe",
      email: "jhon.doe@tryber.me",
      employment_id: 1,
      education_id: 1,
    };
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        ...profile,
        id: 1,
        wp_user_id: 1,
      },
      {
        ...profile,
        id: 2,
        wp_user_id: 2,
      },
    ]);
    await tryber.tables.WpUsers.do().insert([
      {
        ID: 1,
        user_login: "tester",
      },
    ]);
    const basicCampaignObject = {
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
      close_date: new Date().toISOString().split("T")[0],
      campaign_type_id: 1,
      page_preview_id: 1,
      page_manual_id: 2,
      os: "1",
      is_public: 1,
      status_id: 1 as 1,
      platform_id: 1,
      customer_id: 1,
      pm_id: 1,
      project_id: 1,
      customer_title: "Customer title",
      phase_id: 20,
    };
    await tryber.tables.WpAppqCampaignType.do().insert({
      id: 1,
      name: "Type",
      category_id: 1,
    });
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        ...basicCampaignObject,
        id: 1,
        title: "Campaign applied",
      },
      {
        ...basicCampaignObject,
        id: 2,
        title: "Campaign past start date",
        start_date: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      },
      {
        ...basicCampaignObject,
        id: 3,
        title: "Campaign no free spots",
        desired_number_of_testers: 1,
        is_public: 4,
      },
      {
        ...basicCampaignObject,
        id: 4,
        title: "Campaign future start date",
        start_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      },
    ]);

    await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
      {
        campaign_id: 1,
        user_id: 1,
        accepted: 0,
      },
      {
        campaign_id: 3,
        user_id: 2,
        accepted: 0,
      },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.WpUsers.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
  });

  it("should return 'candidate' if the user is already applied", async () => {
    const response = await request(app)
      .get("/users/me/campaigns")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const campaign = response.body.results.find((c: any) => c.id === 1);
    expect(campaign.visibility).toHaveProperty("type", "candidate");
  });

  it("should return 'unavailable' if the start date is in the future", async () => {
    const response = await request(app)
      .get("/users/me/campaigns")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const campaign = response.body.results.find((c: any) => c.id === 2);
    expect(campaign.visibility).toHaveProperty("type", "unavailable");
  });

  it("should return 'unavailable' if there are no free spots", async () => {
    const response = await request(app)
      .get("/users/me/campaigns")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const campaign = response.body.results.find((c: any) => c.id === 3);
    expect(campaign.visibility).toHaveProperty("type", "unavailable");
  });

  it("should return 'available' if the user is not applied, the start date is not in the future, and there are free spots", async () => {
    const response = await request(app)
      .get("/users/me/campaigns")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const campaign = response.body.results.find((c: any) => c.id === 4);
    expect(campaign.visibility).toHaveProperty("type", "available");
  });
});
