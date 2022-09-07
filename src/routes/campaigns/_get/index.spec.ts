import request from "supertest";
import app from "@src/app";
import Campaign from "@src/__mocks__/mockedDb/campaign";
describe("GET /campaigns", () => {
  beforeAll(() => {
    Campaign.insert({ id: 1, title: "First campaign" });
    Campaign.insert({ id: 2, title: "Second campaign" });
    Campaign.insert({ id: 3, title: "Third campaign" });
  });
  afterAll(() => {
    Campaign.clear();
  });

  it("Should answer 403 if not logged in", () => {
    return request(app).get("/campaigns").expect(403);
  });
  it("Should answer 403 if logged in without permissions", async () => {
    const response = await request(app)
      .get("/campaigns")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged as user with full access on campaigns", async () => {
    const response = await request(app)
      .get("/campaigns")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
  });
  it("Should answer 200 if logged as user with access to some campaigns", async () => {
    const response = await request(app)
      .get("/campaigns")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,2]}');
    expect(response.status).toBe(200);
  });
  it("Should answer with a list of all campaigns if has full access", async () => {
    const response = await request(app)
      .get("/campaigns")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(3);
    expect(response.body).toEqual([
      { id: 1, name: "First campaign" },
      { id: 2, name: "Second campaign" },
      { id: 3, name: "Third campaign" },
    ]);
  });
  it("Should answer with a list of your campaigns if has partial access", async () => {
    const response = await request(app)
      .get("/campaigns")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,3]}');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
    expect(response.body).toEqual([
      { id: 1, name: "First campaign" },
      { id: 3, name: "Third campaign" },
    ]);
  });
});
