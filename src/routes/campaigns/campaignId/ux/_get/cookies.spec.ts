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
describe("GET /campaigns/{campaignId}/ux", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 1, campaign_type_id: 10 },
    ]);
    await tryber.tables.WpAppqCampaignType.do().insert({
      id: 10,
      name: "Usability Test",
      category_id: 1,
    });
    await tryber.tables.UxCampaignData.do().insert({
      campaign_id: 1,
      version: 1,
      methodology_type: "qualitative",
      methodology_description: "Methodology description",
      goal: "This is the goal of the reasearch",
      users: 100,
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
  });

  it("Should return 200 if logged as admin user", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);

    expect(mockedGetSignedCookie).toHaveBeenCalledWith({
      url: `https://media*.tryber.me/CP1/*`,
    });

    expect(response.headers).toHaveProperty("set-cookie");
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringContaining("CloudFront-Policy=policy"),
        expect.stringContaining("CloudFront-Signature=signature"),
        expect.stringContaining("CloudFront-Key-Pair-Id=keypairid"),
      ])
    );
  });
});
