import app from "@src/app";
import { tryber } from "@src/features/database";
import resolvePermalinks from "@src/features/wp/resolvePermalinks";
import request from "supertest";

jest.mock("@src/features/wp/resolvePermalinks");

describe("GET /users/me/campaigns - filters", () => {
  beforeAll(async () => {
    await tryber.seeds().campaign_statuses();
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        id: 1,
        wp_user_id: 1,
        name: "jhon",
        surname: "doe",
        email: "jhon.doe@tryber.me",
        employment_id: 1,
        education_id: 1,
      },
    ]);
    await tryber.tables.WpUsers.do().insert([
      {
        ID: 1,
        user_login: "tester",
      },
    ]);
    (resolvePermalinks as jest.Mock).mockImplementation(() => {
      return {
        1: { en: "en/test1", it: "it/test1", es: "es/test1", fr: "fr/test1" },
        2: { en: "en/test2", it: "it/test2", es: "es/test2", fr: "fr/test2" },
        3: { en: "en/test3", it: "it/test3", es: "es/test3", fr: "fr/test3" },
        4: { en: "en/test4", it: "it/test4", es: "es/test4", fr: "fr/test4" },
      };
    });
    const basicCampaignObject = {
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
      close_date: new Date().toISOString().split("T")[0],
      campaign_type_id: 1,
      page_preview_id: 1,
      page_manual_id: 2,
      os: "1",
      is_public: 0 as 0,
      status_id: 1 as 1,
      platform_id: 1,
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
        title: "Campaign selected tester end date in the future",
        end_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      },
      {
        ...basicCampaignObject,
        id: 2,
        title: "Closed campaign selected tester end date in the future",
        end_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        status_id: 2,
      },
      {
        ...basicCampaignObject,
        id: 3,
        title: "Campaign selected tester end date in the past",
        end_date: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      },
      {
        ...basicCampaignObject,
        id: 4,
        title: "Closed campaign selected tester end date in the past",
        end_date: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        status_id: 2,
      },
      {
        ...basicCampaignObject,
        id: 5,
        title: "Closed campaign selected tester",
        status_id: 2,
      },
      {
        ...basicCampaignObject,
        id: 6,
        title: "Simple campaign (unselected)",
        end_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        page_manual_id: 3,
        page_preview_id: 4,
      },
      {
        ...basicCampaignObject,
        id: 7,
        title: "Campaign with end date in the past (unselected)",
        end_date: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        page_manual_id: 3,
        page_preview_id: 4,
      },
    ]);
    await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
      {
        campaign_id: 1,
        user_id: 1,
        accepted: 1,
      },
      {
        campaign_id: 2,
        user_id: 1,
        accepted: 1,
      },
      {
        campaign_id: 3,
        user_id: 1,
        accepted: 1,
      },
      {
        campaign_id: 4,
        user_id: 1,
        accepted: 1,
      },
      {
        campaign_id: 5,
        user_id: 1,
        accepted: 1,
      },
    ]);
    await tryber.tables.WpAppqLcAccess.do().insert({
      id: 2,
      tester_id: 1,
      view_id: 4,
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
    await tryber.tables.WpUsers.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpAppqLcAccess.do().delete();
    jest.resetAllMocks();
  });

  describe("GET /users/me/campaigns - filters - accepted=1&completed=0", () => {
    it("should return only the campaign where i'm selected and with end date in the future", async () => {
      const response = await request(app)
        .get("/users/me/campaigns?filterBy[accepted]=1&filterBy[completed]=0")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("results");
      expect(response.body.results).toHaveLength(2); // TODO: Remove "Closed campaign selected tester end date in the future" from list
      expect(response.body.results[0].id).toBe(1);
    });
  });

  describe("GET /users/me/campaigns - filters - accepted=1&statusId=1&completed=1", () => {
    it("should return only the campaign where i'm selected and with end date in the future", async () => {
      const response = await request(app)
        .get(
          "/users/me/campaigns?filterBy[accepted]=1&filterBy[completed]=1&filterBy[statusId]=1"
        )
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("results");
      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].id).toBe(3);
    });
  });

  describe("GET /users/me/campaigns - filters - accepted=1&statusId=2", () => {
    it("should return only the campaign where i'm selected and with end date in the future", async () => {
      const response = await request(app)
        .get("/users/me/campaigns?filterBy[accepted]=1&filterBy[statusId]=2")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("results");
      expect(response.body.results).toHaveLength(3);
      expect(response.body.results[0].id).toBe(2);
      expect(response.body.results[1].id).toBe(4);
      expect(response.body.results[2].id).toBe(5);
    });
  });

  describe("GET /users/me/campaigns - filters - completed=0", () => {
    it("should return only the campaign where i'm selected and with end date in the future", async () => {
      const response = await request(app)
        .get("/users/me/campaigns?filterBy[completed]=0")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("results");
      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].id).toBe(6);
    });
  });
});
