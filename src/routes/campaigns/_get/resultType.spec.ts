import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
const campaign = {
  id: 1,
  platform_id: 1,
  start_date: "2023-01-13 10:10:10",
  end_date: "2023-01-14 10:10:10",
  title: "This is the title",
  page_preview_id: 1,
  page_manual_id: 1,
  customer_id: 1,
  pm_id: 1,
  project_id: 1,
  customer_title: "",
  campaign_pts: 200,
};
describe("GET /campaigns", () => {
  beforeAll(async () => {
    await tryber.tables.CampaignPhase.do().insert([
      { id: 1, name: "Draft", type_id: 1 },
    ]);
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        ...campaign,
        id: 1,
        title: "First campaign",
        campaign_type: 1,
      },
      {
        ...campaign,
        id: 2,
        title: "Second campaign",
        campaign_type: 0,
      },
      {
        ...campaign,
        id: 3,
        title: "Third campaign",
        campaign_type: -1,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.CampaignPhase.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
  });

  it("Should return just visibility data if field is set with resultType", async () => {
    const response = await request(app)
      .get("/campaigns?fields=id,resultType")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          resultType: "bugparade",
        }),
        expect.objectContaining({
          id: 2,
          resultType: "bug",
        }),
        expect.objectContaining({
          id: 3,
          resultType: "no",
        }),
      ])
    );
  });
});
