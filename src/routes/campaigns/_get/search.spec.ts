import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
const campaign = {
  id: 1,
  platform_id: 1,
  start_date: new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  end_date: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
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
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        id: 1,
        name: "name",
        surname: "surname",
        email: "",
        wp_user_id: 1,
        education_id: 1,
        employment_id: 1,
      },
    ]);
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 1, title: "First test campaign" },
      { ...campaign, id: 2, title: "Second test campaign" },
      { ...campaign, id: 3, title: "Third campaign" },
      { ...campaign, id: 4, title: "Third campaign 2" },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.CampaignPhase.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
  });

  it("Should search by id", async () => {
    const response = await request(app)
      .get("/campaigns?search=1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].id).toBe(1);
  });

  it("Should search by title", async () => {
    const response = await request(app)
      .get("/campaigns?search=First test campaign")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].id).toBe(1);
  });

  it("Should search by partial title", async () => {
    const response = await request(app)
      .get("/campaigns?search=test")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1 }),
        expect.objectContaining({ id: 2 }),
      ])
    );
  });

  it("Should search by title or id", async () => {
    const response = await request(app)
      .get("/campaigns?search=2")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 2 }),
        expect.objectContaining({ id: 4 }),
      ])
    );
  });

  it("Should return total of filtered items", async () => {
    const response = await request(app)
      .get("/campaigns?search=2&limit=10")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
  });
});
