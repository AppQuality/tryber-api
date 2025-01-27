import app from "@src/app";
import { tryber } from "@src/features/database";
import resolvePermalinks from "@src/features/wp/resolvePermalinks";
import request from "supertest";

jest.mock("@src/features/wp/resolvePermalinks");

const sevenDaysFromNow = new Date().setDate(new Date().getDate() + 7);
const endDate = new Date(sevenDaysFromNow).toISOString().split("T")[0];
const fourteenDaysFromNow = new Date().setDate(new Date().getDate() + 14);
const closeDate = new Date(fourteenDaysFromNow).toISOString().split("T")[0];

describe("GET /users/me/campaigns - cap", () => {
  beforeAll(async () => {
    (resolvePermalinks as jest.Mock).mockImplementation(() => {
      return {
        1: { en: "en/test1", it: "it/test1", es: "es/test1", fr: "fr/test1" },
        2: { en: "en/test2", it: "it/test2", es: "es/test2", fr: "fr/test2" },
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
      project_id: 1,
      customer_title: "Customer",
      id: 1,
      title: "Public campaign",
      is_public: 4,
      phase_id: 20,
      desired_number_of_testers: 10,
    };
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 1 },
      { ...campaign, id: 2 },
    ]);

    await tryber.tables.CampaignDossierData.do().insert({
      id: 1,
      campaign_id: 1,
      created_by: 1,
      updated_by: 1,
    });

    await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
      { campaign_id: 1, user_id: 10, accepted: -1 },
      { campaign_id: 1, user_id: 20, accepted: 0 },
      { campaign_id: 2, user_id: 30, accepted: 0 },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.CampaignPhase.do().delete();
    jest.resetAllMocks();
  });

  it("Should show free spots on the campaign with target", async () => {
    const response = await request(app)
      .get("/users/me/campaigns")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(Array.isArray(response.body.results)).toBe(true);
    expect(response.body.results.length).toBe(2);
    expect(response.body.results[0]).toHaveProperty("visibility");
    expect(response.body.results[0]).toHaveProperty("id", 1);
    expect(response.body.results[0].visibility).toHaveProperty("freeSpots", 9);
  });

  it("Should show total spots on the campaign with target", async () => {
    const response = await request(app)
      .get("/users/me/campaigns")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(Array.isArray(response.body.results)).toBe(true);
    expect(response.body.results.length).toBe(2);
    expect(response.body.results[0]).toHaveProperty("visibility");
    expect(response.body.results[0].visibility).toHaveProperty(
      "totalSpots",
      10
    );
  });
});
