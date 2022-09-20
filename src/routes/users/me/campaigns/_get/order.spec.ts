import request from "supertest";
import app from "@src/app";
import campaigns from "@src/__mocks__/mockedDb/campaign";
import campaignTypes from "@src/__mocks__/mockedDb/campaignType";
import resolvePermalinks from "@src/features/wp/resolvePermalinks";

jest.mock("@src/features/wp/resolvePermalinks");

const dayFromNow = (days: number) => {
  return new Date(new Date().getTime() + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
};

beforeAll(() => {
  (resolvePermalinks as jest.Mock).mockImplementation(() => {
    return {
      1: { en: "en/test1", it: "it/test1", es: "es/test1" },
      2: { en: "en/test2", it: "it/test2", es: "es/test2" },
    };
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
    is_public: 1 as 0,
    status_id: 1 as 1,
  };
  campaignTypes.insert({
    id: 1,
  });
  campaigns.insert({
    ...basicCampaignObject,
    id: 1,
    start_date: dayFromNow(2),
    end_date: dayFromNow(3),
    close_date: dayFromNow(2),
  });
  campaigns.insert({
    ...basicCampaignObject,
    id: 2,
    start_date: dayFromNow(1),
    end_date: dayFromNow(2),
    close_date: dayFromNow(3),
  });
  campaigns.insert({
    ...basicCampaignObject,
    id: 3,
    start_date: dayFromNow(3),
    end_date: dayFromNow(4),
    close_date: dayFromNow(4),
  });
  campaigns.insert({
    ...basicCampaignObject,
    id: 4,
    start_date: dayFromNow(4),
    end_date: dayFromNow(1),
    close_date: dayFromNow(1),
  });
});
afterAll(() => {
  campaigns.clear();
  campaignTypes.clear();
  jest.resetAllMocks();
});
describe("GET /users/me/campaigns - order - start_date ", () => {
  it("Should return 200 and ordered by start_date DESC on default", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/?orderBy=start_date")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toHaveLength(4);
    expect(
      response.body.results.map((r: { id: number }) => r.id)
    ).toMatchObject([4, 3, 1, 2]);
  });
  it("Should return 200 and ordered by start_date DESC if set", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/?orderBy=start_date&order=DESC")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toHaveLength(4);
    expect(
      response.body.results.map((r: { id: number }) => r.id)
    ).toMatchObject([4, 3, 1, 2]);
  });
  it("Should return 200 and ordered by start_date ASC if set", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/?orderBy=start_date&order=ASC")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toHaveLength(4);
    expect(
      response.body.results.map((r: { id: number }) => r.id)
    ).toMatchObject([2, 1, 3, 4]);
  });
});

describe("GET /users/me/campaigns - order - end_date ", () => {
  it("Should return 200 and ordered by end_date DESC on default", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/?orderBy=end_date")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toHaveLength(4);
    expect(
      response.body.results.map((r: { id: number }) => r.id)
    ).toMatchObject([3, 1, 2, 4]);
  });
  it("Should return 200 and ordered by end_date DESC if set", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/?orderBy=end_date&order=DESC")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toHaveLength(4);
    expect(
      response.body.results.map((r: { id: number }) => r.id)
    ).toMatchObject([3, 1, 2, 4]);
  });
  it("Should return 200 and ordered by end_date ASC if set", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/?orderBy=end_date&order=ASC")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toHaveLength(4);
    expect(
      response.body.results.map((r: { id: number }) => r.id)
    ).toMatchObject([4, 2, 1, 3]);
  });
});

describe("GET /users/me/campaigns - order - close_date ", () => {
  it("Should return 200 and ordered by close_date DESC on default", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/?orderBy=close_date")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toHaveLength(4);
    expect(
      response.body.results.map((r: { id: number }) => r.id)
    ).toMatchObject([3, 2, 1, 4]);
  });
  it("Should return 200 and ordered by close_date DESC if set", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/?orderBy=close_date&order=DESC")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toHaveLength(4);
    expect(
      response.body.results.map((r: { id: number }) => r.id)
    ).toMatchObject([3, 2, 1, 4]);
  });
  it("Should return 200 and ordered by close_date ASC if set", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/?orderBy=close_date&order=ASC")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toHaveLength(4);
    expect(
      response.body.results.map((r: { id: number }) => r.id)
    ).toMatchObject([4, 1, 2, 3]);
  });
});
