import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";
const campaign = {
  id: 1,
  platform_id: 1,
  start_date: "2020-01-01",
  end_date: "2020-01-01",
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

  it("Should retrun campaigns with id and name if query parmater FIELDS is not set", async () => {
    const response = await request(app)
      .get("/campaigns")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,3]}');
    expect(response.body.length).toBe(2);
    expect(response.body).toEqual([
      { id: 1, name: "First campaign" },
      { id: 3, name: "Third campaign" },
    ]);
    expect(response.body[0].length).toEqual(response.body[1].length);
  });

  it("Should retrun just campaigns ids if field is set with id", async () => {
    const response = await request(app)
      .get("/campaigns?fields=id")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,3]}');
    expect(response.body).toEqual([{ id: 1 }, { id: 3 }]);
    expect(response.body[0].length).toEqual(response.body[1].length);
    expect(response.body[0].length).toBe(1);
  });

  it("Should retrun just campaigns name if field is set with name", async () => {
    const response = await request(app)
      .get("/campaigns?fields=name")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,3]}');
    expect(response.body).toEqual([
      { name: "First campaign" },
      { name: "Third campaign" },
    ]);
    expect(response.body[0].length).toEqual(response.body[1].length);
    expect(response.body[0].length).toBe(1);
  });

  it("Should retrun just campaigns id and name if field is set with id,name", async () => {
    const response = await request(app)
      .get("/campaigns?fields=name,id")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,3]}');
    expect(response.body).toEqual([
      { id: 1, name: "First campaign" },
      { id: 3, name: "Third campaign" },
    ]);
    expect(response.body[0].length).toEqual(response.body[1].length);
    expect(response.body[0].length).toBe(2);
  });
});
