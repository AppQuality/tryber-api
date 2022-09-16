import request from "supertest";
import app from "@src/app";
import campaigns from "@src/__mocks__/mockedDb/campaign";
import campaignTypes from "@src/__mocks__/mockedDb/campaignType";
import resolvePermalinks from "@src/features/wp/resolvePermalinks";

jest.mock("@src/features/wp/resolvePermalinks", () => {
  return jest.fn().mockImplementation(() => {
    return {
      1: { en: "en/test1", it: "it/test1", es: "es/test1" },
      2: { en: "en/test2", it: "it/test2", es: "es/test2" },
    };
  });
});

describe("GET /users/me/campaigns", () => {
  beforeAll(() => {
    campaigns.insert({
      id: 1,
      title: "Public campaign",
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
      close_date: new Date().toISOString().split("T")[0],
      campaign_type_id: 1,
      page_preview_id: 1,
      page_manual_id: 2,
      os: "1",
      is_public: 1,
    });
    campaignTypes.insert({
      id: 1,
    });
  });
  it("should answer 403 if not logged in", () => {
    return request(app).get("/users/me/campaigns").expect(403);
  });

  it("should answer ", async () => {
    const response = await request(app)
      .get("/users/me/campaigns")
      .set("Authorization", "Bearer tester");
    console.log(response.body);
  });
});
