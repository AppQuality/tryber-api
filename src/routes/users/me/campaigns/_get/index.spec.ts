import request from "supertest";
import app from "@src/app";
import campaigns from "@src/__mocks__/mockedDb/campaign";
import campaignTypes from "@src/__mocks__/mockedDb/campaignType";
import resolvePermalinks from "@src/features/wp/resolvePermalinks";

jest.mock("@src/features/wp/resolvePermalinks");
describe("GET /users/me/campaigns", () => {
  const sevenDaysFromNow = new Date().setDate(new Date().getDate() + 7);
  const endDate = new Date(sevenDaysFromNow).toISOString().split("T")[0];
  const fourteenDaysFromNow = new Date().setDate(new Date().getDate() + 14);
  const closeDate = new Date(fourteenDaysFromNow).toISOString().split("T")[0];
  beforeAll(() => {
    (resolvePermalinks as jest.Mock).mockImplementation(() => {
      return {
        1: { en: "en/test1", it: "it/test1", es: "es/test1" },
        2: { en: "en/test2", it: "it/test2", es: "es/test2" },
      };
    });
    campaignTypes.insert({
      id: 1,
    });

    campaigns.insert({
      id: 1,
      title: "Public campaign",
      start_date: new Date().toISOString().split("T")[0],
      end_date: endDate,
      close_date: closeDate,
      campaign_type_id: 1,
      page_preview_id: 1,
      page_manual_id: 2,
      os: "1",
      is_public: 1,
    });
    campaigns.insert({
      id: 2,
      title: "Small Group campaign",
      start_date: new Date().toISOString().split("T")[0],
      end_date: endDate,
      close_date: closeDate,
      campaign_type_id: 1,
      page_preview_id: 1,
      page_manual_id: 2,
      os: "1",
      is_public: 0,
    });
  });
  afterAll(() => {
    campaigns.clear();
    campaignTypes.clear();
    jest.resetAllMocks();
  });
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
    expect(response.body.results[0]).toHaveProperty("name", "Public campaign");
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
    console.log(response.body.results[0]);
    expect(response.body.results[0].dates).toHaveProperty("end", endDate);
  });
  it("should answer with a single campaign with closeDate = fourteen days from now", async () => {
    const response = await request(app)
      .get("/users/me/campaigns")
      .set("Authorization", "Bearer tester");
    expect(response.body).toHaveProperty("results");
    expect(response.body.results[0]).toHaveProperty("dates");
    console.log(response.body.results[0]);
    expect(response.body.results[0].dates).toHaveProperty("close", closeDate);
  });
  it("should answer with a single campaign with campaign type", async () => {
    const response = await request(app)
      .get("/users/me/campaigns")
      .set("Authorization", "Bearer tester");
    expect(response.body).toHaveProperty("results");
    console.log(response.body.results[0]);
    expect(response.body.results[0]).toHaveProperty("campaign_type", "Type");
  });
});
