import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
  .toISOString()
  .split("T")[0];
const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
  .toISOString()
  .split("T")[0];

const campaign = {
  id: 1,
  platform_id: 1,
  start_date: today,
  end_date: today,
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
      {
        ...campaign,
        id: 1,
        start_date: today,
        end_date: yesterday,
        title: "First campaign",
      },
      {
        ...campaign,
        id: 2,
        start_date: yesterday,
        end_date: tomorrow,
        title: "Second campaign",
      },
      {
        ...campaign,
        id: 3,
        start_date: tomorrow,
        end_date: today,
        title: "Third campaign",
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
  });

  it("Should order by id DESC by default", async () => {
    const response = await request(app)
      .get("/campaigns")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(3);
    expect(response.body.items[0].id).toBe(3);
    expect(response.body.items[1].id).toBe(2);
    expect(response.body.items[2].id).toBe(1);
  });

  it("Should order by id by default", async () => {
    const response = await request(app)
      .get("/campaigns?order=ASC")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(3);
    expect(response.body.items[0].id).toBe(1);
    expect(response.body.items[1].id).toBe(2);
    expect(response.body.items[2].id).toBe(3);
  });

  it("Should allow ordering by start date, default DESC", async () => {
    const response = await request(app)
      .get("/campaigns?orderBy=startDate")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(3);
    expect(response.body.items[0].id).toBe(3);
    expect(response.body.items[1].id).toBe(1);
    expect(response.body.items[2].id).toBe(2);
  });
  it("Should allow ordering by start date, ASC", async () => {
    const response = await request(app)
      .get("/campaigns?orderBy=startDate&order=ASC")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(3);
    expect(response.body.items[0].id).toBe(2);
    expect(response.body.items[1].id).toBe(1);
    expect(response.body.items[2].id).toBe(3);
  });

  it("Should allow ordering by end date, default DESC", async () => {
    const response = await request(app)
      .get("/campaigns?orderBy=endDate")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(3);
    expect(response.body.items[0].id).toBe(2);
    expect(response.body.items[1].id).toBe(3);
    expect(response.body.items[2].id).toBe(1);
  });
  it("Should allow ordering by end date, ASC", async () => {
    const response = await request(app)
      .get("/campaigns?orderBy=endDate&order=ASC")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(3);
    expect(response.body.items[0].id).toBe(1);
    expect(response.body.items[1].id).toBe(3);
    expect(response.body.items[2].id).toBe(2);
  });
});
