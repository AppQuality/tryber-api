import campaigns from "@src/__mocks__/mockedDb/campaign";
import campaignTypes from "@src/__mocks__/mockedDb/campaignType";
import candidature from "@src/__mocks__/mockedDb/cpHasCandidates";
import app from "@src/app";
import { tryber } from "@src/features/database";
import resolvePermalinks from "@src/features/wp/resolvePermalinks";
import request from "supertest";

jest.mock("@src/features/wp/resolvePermalinks");
describe("GET /users/me/campaigns - pagination ", () => {
  beforeAll(async () => {
    (resolvePermalinks as jest.Mock).mockImplementation(() => {
      return {
        1: { en: "en/test1", it: "it/test1", es: "es/test1" },
        2: { en: "en/test2", it: "it/test2", es: "es/test2" },
      };
    });

    await tryber.seeds().campaign_statuses();

    campaignTypes.insert({
      id: 1,
    });
    const basicCampaignObject = {
      title: "My campaign",
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
      close_date: new Date().toISOString().split("T")[0],
      campaign_type_id: 1,
      page_preview_id: 1,
      page_manual_id: 2,
      os: "1",
      is_public: 1,
      status_id: 1,
      pm_id: 1,
      platform_id: 1,
      customer_id: 1,
      project_id: 1,
      customer_title: "Customer title",
      phase_id: 10,
    };
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        ...basicCampaignObject,
        id: 1,
      },
      {
        ...basicCampaignObject,
        id: 2,
      },
      {
        ...basicCampaignObject,
        id: 3,
      },
      {
        ...basicCampaignObject,
        id: 4,
        status_id: 2,
      },
      {
        ...basicCampaignObject,
        id: 5,
        status_id: 2,
      },
      {
        ...basicCampaignObject,
        id: 6,
        status_id: 2,
      },
      {
        ...basicCampaignObject,
        id: 7,
        status_id: 2,
      },
      { ...basicCampaignObject, id: 8 },
    ]);
    candidature.insert({
      campaign_id: 8,
      user_id: 1,
      accepted: 1,
    });
  });
  afterAll(() => {
    campaigns.clear();
    campaignTypes.clear();
    candidature.clear();
    jest.resetAllMocks();
  });
  describe("GET /users/me/campaigns - pagination - limit by 5", () => {
    it("Should return 200 and the first 5 campaigns", async () => {
      const response = await request(app)
        .get("/users/me/campaigns?limit=5")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("results");
      expect(response.body.results).toHaveLength(5);
      expect(response.body.results[0].id).toBe(1);
      expect(response.body.results[1].id).toBe(2);
      expect(response.body.results[2].id).toBe(3);
      expect(response.body.results[3].id).toBe(4);
      expect(response.body.results[4].id).toBe(5);
    });

    it("Should return 5 as size", async () => {
      const response = await request(app)
        .get("/users/me/campaigns?limit=5")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("size", 5);
    });
    it("Should return 7 as total", async () => {
      const response = await request(app)
        .get("/users/me/campaigns?limit=5")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("total", 7);
    });
    it("Should return 0 as start", async () => {
      const response = await request(app)
        .get("/users/me/campaigns?limit=5")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("start", 0);
    });
  });

  describe("GET /users/me/campaigns - pagination - limit by 3, filter by status id 2", () => {
    it("Should return 200 and the first 3 closed campaigns", async () => {
      const response = await request(app)
        .get("/users/me/campaigns?limit=3&filterBy[statusId]=2")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("results");
      expect(response.body.results).toHaveLength(3);
      expect(response.body.results[0].id).toBe(4);
      expect(response.body.results[1].id).toBe(5);
      expect(response.body.results[2].id).toBe(6);
    });

    it("Should return 3 as size", async () => {
      const response = await request(app)
        .get("/users/me/campaigns?limit=3&filterBy[statusId]=2")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("size", 3);
    });
    it("Should return 4 as total", async () => {
      const response = await request(app)
        .get("/users/me/campaigns?limit=3&filterBy[statusId]=2")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("total", 4);
    });
    it("Should return 0 as start", async () => {
      const response = await request(app)
        .get("/users/me/campaigns?limit=3&filterBy[statusId]=2")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("start", 0);
    });
  });

  describe("GET /users/me/campaigns - pagination - limit by 10", () => {
    it("Should return 200 and all the campaigns", async () => {
      const response = await request(app)
        .get("/users/me/campaigns?limit=10")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("results");
      expect(response.body.results).toHaveLength(7);
      expect(response.body.results[0].id).toBe(1);
      expect(response.body.results[1].id).toBe(2);
      expect(response.body.results[2].id).toBe(3);
      expect(response.body.results[3].id).toBe(4);
      expect(response.body.results[4].id).toBe(5);
      expect(response.body.results[5].id).toBe(6);
      expect(response.body.results[6].id).toBe(7);
    });

    it("Should return 7 as size", async () => {
      const response = await request(app)
        .get("/users/me/campaigns?limit=10")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("size", 7);
    });
    it("Should return 7 as total", async () => {
      const response = await request(app)
        .get("/users/me/campaigns?limit=10")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("total", 7);
    });
    it("Should return 0 as start", async () => {
      const response = await request(app)
        .get("/users/me/campaigns?limit=10")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("start", 0);
    });
  });

  describe("GET /users/me/campaigns - pagination - limit by 5, start by 1", () => {
    it("Should return 200 and the first 5 campaigns", async () => {
      const response = await request(app)
        .get("/users/me/campaigns?limit=5&start=1")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("results");
      expect(response.body.results).toHaveLength(5);
      expect(response.body.results[0].id).toBe(2);
      expect(response.body.results[1].id).toBe(3);
      expect(response.body.results[2].id).toBe(4);
      expect(response.body.results[3].id).toBe(5);
      expect(response.body.results[4].id).toBe(6);
    });

    it("Should return 5 as size", async () => {
      const response = await request(app)
        .get("/users/me/campaigns?limit=5&start=1")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("size", 5);
    });
    it("Should return 7 as total", async () => {
      const response = await request(app)
        .get("/users/me/campaigns?limit=5&start=1")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("total", 7);
    });
    it("Should return 1 as start", async () => {
      const response = await request(app)
        .get("/users/me/campaigns?limit=5&start=1")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("start", 1);
    });
  });

  describe("GET /users/me/campaigns - pagination - limit by 5, accepted only", () => {
    it("Should return 200 and the first 5 campaigns", async () => {
      const response = await request(app)
        .get("/users/me/campaigns?limit=5&filterBy[accepted]=1")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("results");
      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].id).toBe(8);
    });

    it("Should return 1 as size", async () => {
      const response = await request(app)
        .get("/users/me/campaigns?limit=5&filterBy[accepted]=1")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("size", 1);
    });
    it("Should return 7 as total", async () => {
      const response = await request(app)
        .get("/users/me/campaigns?limit=5&filterBy[accepted]=1")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("total", 1);
    });
    it("Should return 0 as start", async () => {
      const response = await request(app)
        .get("/users/me/campaigns?limit=5&filterBy[accepted]=1")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("start", 0);
    });
  });
});
