import app from "@src/app";
import { tryber } from "@src/features/database";
import { getSignedCookie } from "@src/features/s3/cookieSign";
import request from "supertest";

jest.mock("@src/features/checkUrl", () => ({
  checkUrl: jest.fn().mockImplementation(() => true),
}));

jest.mock("@src/features/s3/cookieSign");
const mockedGetSignedCookie = jest.mocked(getSignedCookie, true);

mockedGetSignedCookie.mockImplementation(({ url }) => {
  return Promise.resolve({
    "CloudFront-Policy": "policy",
    "CloudFront-Signature": "signature",
    "CloudFront-Key-Pair-Id": "keypairid",
  });
});
const campaign = {
  title: "Test Campaign",
  platform_id: 1,
  start_date: "2021-01-01",
  end_date: "2021-01-01",
  pm_id: 1,
  page_manual_id: 1,
  page_preview_id: 1,
  customer_id: 1,
  project_id: 1,
  customer_title: "Test Customer",
};

describe("GET /campaigns/{campaignId}/ux - draft", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 1, campaign_type_id: 10 },
    ]);
    await tryber.tables.UxCampaignData.do().insert({
      campaign_id: 1,
      version: 1,
      methodology_description: "Ux Description",
      methodology_type: "qualitative",
      goal: "This is the goal of the reasearch",
      users: 100,
    });
    await tryber.tables.WpAppqCampaignType.do().insert([
      {
        id: 1,
        name: "UX Generic",
        category_id: 1,
      },
      {
        id: 10,
        name: "Usability Test",
        category_id: 1,
      },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
  });

  it("Should return status draft if there are no published campaign data", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("status", "draft");
  });

  it("Should return methodology", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("methodology");
  });

  it("Should return methodology name", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body.methodology).toHaveProperty("name");
    expect(response.body.methodology.name).toEqual("Usability Test");
  });
  it("Should return methodology description", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body.methodology).toHaveProperty("description");
    expect(response.body.methodology.description).toEqual("Ux Description");
  });
  it("Should return methodology type", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body.methodology).toHaveProperty("type");
    expect(response.body.methodology.type).toEqual("qualitative");
  });
  it("Should return methodology goal", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("goal");
    expect(response.body.goal).toEqual("This is the goal of the reasearch");
  });

  it("Should return methodology usersNumber", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("usersNumber");
    expect(response.body.usersNumber).toEqual(100);
  });
});
