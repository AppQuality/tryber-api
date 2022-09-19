import request from "supertest";
import app from "@src/app";
import campaigns from "@src/__mocks__/mockedDb/campaign";
import candidature from "@src/__mocks__/mockedDb/cpHasCandidates";
import campaignTypes from "@src/__mocks__/mockedDb/campaignType";
import resolvePermalinks from "@src/features/wp/resolvePermalinks";

jest.mock("@src/features/wp/resolvePermalinks");

beforeAll(() => {
  campaignTypes.insert({
    id: 1,
  });
  campaigns.insert({
    id: 1,
    title: "Campaign with manual not public in all languages",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    close_date: new Date().toISOString().split("T")[0],
    campaign_type_id: 1,
    page_preview_id: 3,
    page_manual_id: 2,
    os: "1",
    is_public: 1,
  });
  campaigns.insert({
    id: 2,
    title: "Campaign with preview not public in all language",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    close_date: new Date().toISOString().split("T")[0],
    campaign_type_id: 1,
    page_preview_id: 2,
    page_manual_id: 3,
    os: "1",
    is_public: 1,
  });
  campaigns.insert({
    id: 3,
    title: "Campaign with  preview not public in a single language",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    close_date: new Date().toISOString().split("T")[0],
    campaign_type_id: 1,
    page_preview_id: 1,
    page_manual_id: 3,
    os: "1",
    is_public: 1,
  });
});
afterAll(() => {
  campaigns.clear();
  campaignTypes.clear();
});
describe("GET /users/me/campaigns - manual and/or preview not public - selected tester", () => {
  beforeAll(() => {
    (resolvePermalinks as jest.Mock).mockImplementation(() => {
      return {
        1: { en: "#", it: "it/test1", es: "es/test1" },
        2: { en: "#", it: "#", es: "#" },
        3: { en: "en/test3", it: "it/test3", es: "es/test3" },
      };
    });
    candidature.insert({
      campaign_id: 1,
      user_id: 1,
      accepted: 1,
    });
    candidature.insert({
      campaign_id: 2,
      user_id: 1,
      accepted: 1,
    });
    candidature.insert({
      campaign_id: 3,
      user_id: 1,
      accepted: 1,
    });
  });
  afterAll(() => {
    candidature.clear();
    jest.resetAllMocks();
  });

  it("should answer with all campaigns if filter is by accepted applications", async () => {
    const response = await request(app)
      .get("/users/me/campaigns?filterBy[accepted]=1")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(Array.isArray(response.body.results)).toBe(true);
    console.log(response.body);
    expect(response.body.results.length).toBe(3);
  });
});

describe("GET /users/me/campaigns - manual and/or preview not public - not selected tester", () => {
  beforeAll(() => {
    (resolvePermalinks as jest.Mock).mockImplementation(() => {
      return {
        1: { en: "#", it: "it/test1", es: "es/test1" },
        2: { en: "#", it: "#", es: "#" },
        3: { en: "en/test3", it: "it/test3", es: "es/test3" },
      };
    });
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  it("should answer with a single campaign if filter is by not accepted applications", async () => {
    const response = await request(app)
      .get("/users/me/campaigns?filterBy[accepted]=0")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(Array.isArray(response.body.results)).toBe(true);
    expect(response.body.results.length).toBe(1);

    expect(response.body.results[0]).toHaveProperty("id", 1);
  });

  it("should answer with a single campaign if no filter is applied", async () => {
    const response = await request(app)
      .get("/users/me/campaigns")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(Array.isArray(response.body.results)).toBe(true);
    expect(response.body.results.length).toBe(1);

    expect(response.body.results[0]).toHaveProperty("id", 1);
  });
});
