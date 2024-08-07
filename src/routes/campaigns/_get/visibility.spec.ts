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
        is_public: 0,
      },
      {
        ...campaign,
        id: 2,
        title: "Second campaign",
        is_public: 3,
      },
      {
        ...campaign,
        id: 3,
        title: "Third campaign",
        is_public: 1,
      },
      {
        ...campaign,
        id: 4,
        title: "Fourth campaign",
        is_public: 2,
      },
      {
        ...campaign,
        id: 5,
        title: "Fifth campaign",
        is_public: 4,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.CampaignPhase.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
  });

  it("Should return just visibility data if field is set with visibility", async () => {
    const response = await request(app)
      .get("/campaigns?fields=visibility,id")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        {
          id: 1,
          visibility: "admin",
        },
        {
          id: 2,
          visibility: "smallgroup",
        },
        {
          id: 3,
          visibility: "logged",
        },
        {
          id: 4,
          visibility: "public",
        },
        {
          id: 5,
          visibility: "target",
        },
      ])
    );
  });
});
