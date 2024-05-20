import candidature from "@src/__mocks__/mockedDb/cpHasCandidates";
import app from "@src/app";
import { tryber } from "@src/features/database";
import resolvePermalinks from "@src/features/wp/resolvePermalinks";
import request from "supertest";

jest.mock("@src/features/wp/resolvePermalinks");

const sevenDaysFromNow = new Date().setDate(new Date().getDate() + 7);
const endDate = new Date(sevenDaysFromNow).toISOString().split("T")[0];
const fourteenDaysFromNow = new Date().setDate(new Date().getDate() + 14);
const closeDate = new Date(fourteenDaysFromNow).toISOString().split("T")[0];

describe("GET /users/me/campaigns", () => {
  beforeAll(async () => {
    (resolvePermalinks as jest.Mock).mockImplementation(() => {
      return {
        1: { en: "en/test1", it: "it/test1", es: "es/test1" },
        2: { en: "en/test2", it: "it/test2", es: "es/test2" },
      };
    });
    await tryber.tables.WpAppqCampaignType.do().insert({
      id: 1,
      name: "Type",
      category_id: 1,
    });

    await tryber.seeds().campaign_statuses();
    const campaign = {
      start_date: new Date().toISOString().split("T")[0],
      end_date: endDate,
      close_date: closeDate,
      campaign_type_id: 1,
      page_preview_id: 1,
      page_manual_id: 2,
      os: "1",
      platform_id: 1,
      pm_id: 1,
      customer_id: 1,
      project_id: 1,
      customer_title: "Customer",
    };
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        ...campaign,
        id: 1,
        title: "Public campaign",
        is_public: 1,
        phase_id: 20,
      },
      {
        ...campaign,
        id: 2,
        title: "Small Group campaign",
        is_public: 0,
        phase_id: 20,
      },
      {
        ...campaign,
        id: 3,
        title: "Public campaign - draft",
        is_public: 1,
        phase_id: 1,
      },
      {
        ...campaign,
        id: 4,
        title: "Small Group campaign - draft",
        is_public: 0,
        phase_id: 1,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.CampaignPhase.do().delete();
    jest.resetAllMocks();
  });
  describe("GET /users/me/campaigns", () => {
    it("should answer 403 if not logged in", () => {
      return request(app).get("/users/me/campaigns").expect(403);
    });

    it("should answer with a single campaign", async () => {
      const response = await request(app)
        .get("/users/me/campaigns")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("results");
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.results.length).toBe(1);
    });
    it("should answer with a single campaign with title", async () => {
      const response = await request(app)
        .get("/users/me/campaigns")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("results");
      expect(response.body.results[0]).toHaveProperty(
        "name",
        "Public campaign"
      );
    });
    it("should answer with a single campaign with startDate = today", async () => {
      const response = await request(app)
        .get("/users/me/campaigns")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("results");
      expect(response.body.results[0]).toHaveProperty("dates");
      expect(response.body.results[0].dates).toHaveProperty(
        "start",
        new Date().toISOString().split("T")[0]
      );
    });
    it("should answer with a single campaign with endDate = seven days from now", async () => {
      const response = await request(app)
        .get("/users/me/campaigns")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("results");
      expect(response.body.results[0]).toHaveProperty("dates");
      expect(response.body.results[0].dates).toHaveProperty("end", endDate);
    });
    it("should answer with a single campaign with closeDate = fourteen days from now", async () => {
      const response = await request(app)
        .get("/users/me/campaigns")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("results");
      expect(response.body.results[0]).toHaveProperty("dates");
      expect(response.body.results[0].dates).toHaveProperty("close", closeDate);
    });
    it("should answer with a single campaign with campaign type", async () => {
      const response = await request(app)
        .get("/users/me/campaigns")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("results");
      expect(response.body.results[0]).toHaveProperty("campaign_type", "Type");
    });
    it("should answer with a single campaign with applied = false", async () => {
      const response = await request(app)
        .get("/users/me/campaigns")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("results");
      expect(response.body.results[0]).toHaveProperty("applied", false);
    });
    it("should answer with a single campaign with manuals", async () => {
      const response = await request(app)
        .get("/users/me/campaigns")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("results");
      expect(response.body.results[0]).toHaveProperty("manual_link", {
        en: "en/test2",
        it: "it/test2",
        es: "es/test2",
      });
    });
    it("should answer with a single campaign with previews", async () => {
      const response = await request(app)
        .get("/users/me/campaigns")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("results");
      expect(response.body.results[0]).toHaveProperty("preview_link", {
        en: "en/test1",
        it: "it/test1",
        es: "es/test1",
      });
    });
  });

  describe("GET /users/me/campaigns - with application", () => {
    beforeAll(() => {
      candidature.insert({
        user_id: 1,
        campaign_id: 1,
        accepted: 0,
      });
    });
    afterAll(() => {
      candidature.clear();
    });
    it("should answer with a single campaign with applied = true", async () => {
      const response = await request(app)
        .get("/users/me/campaigns")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveProperty("results");
      expect(response.body.results[0]).toHaveProperty("applied", true);
    });
  });
});
