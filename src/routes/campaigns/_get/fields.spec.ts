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
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 1, title: "First campaign" },
      { ...campaign, id: 2, title: "Second campaign" },
      { ...campaign, id: 3, title: "Third campaign" },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
  });

  it("Should return campaigns with all fields if query parameter FIELDS is not set", async () => {
    const response = await request(app)
      .get("/campaigns")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,3]}');
    expect(response.body.items.length).toBe(2);
    expect(response.body.items).toEqual([
      {
        id: 1,
        name: "First campaign",
        startDate: "2023-01-13 10:10:10",
        endDate: "2023-01-14 10:10:10",
      },
      {
        id: 3,
        name: "Third campaign",
        startDate: "2023-01-13 10:10:10",
        endDate: "2023-01-14 10:10:10",
      },
    ]);
  });

  it("Should return just campaigns ids if fields is set with id", async () => {
    const response = await request(app)
      .get("/campaigns?fields=id")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,3]}');
    expect(response.body.items).toEqual([{ id: 1 }, { id: 3 }]);
  });

  it("Should retrun just campaigns name if fields is set with name", async () => {
    const response = await request(app)
      .get("/campaigns?fields=name")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,3]}');
    expect(response.body.items).toEqual([
      { name: "First campaign" },
      { name: "Third campaign" },
    ]);
  });

  it("Should retrun just campaigns id and name if fields is set with id,name", async () => {
    const response = await request(app)
      .get("/campaigns?fields=name,id")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,3]}');
    expect(response.body.items).toEqual([
      { id: 1, name: "First campaign" },
      { id: 3, name: "Third campaign" },
    ]);
  });
  it("Should retrun campaigns id,startDate,endDate if fields is set with id,startDate,endDate", async () => {
    const response = await request(app)
      .get("/campaigns?fields=startDate,endDate,id")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,3]}');
    expect(response.body.items).toEqual([
      {
        id: 1,
        startDate: "2023-01-13 10:10:10",
        endDate: "2023-01-14 10:10:10",
      },
      {
        id: 3,
        startDate: "2023-01-13 10:10:10",
        endDate: "2023-01-14 10:10:10",
      },
    ]);
  });
});
