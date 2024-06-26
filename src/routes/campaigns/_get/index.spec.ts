import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
const campaign = {
  id: 1,
  platform_id: 1,
  // start_date: is stringified today date in format yyyy-mm-dd
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
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        id: 2,
        name: "test",
        surname: "test",
        email: "",
        wp_user_id: 2,
        education_id: 1,
        employment_id: 1,
      },
    ]);
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 1, title: "First campaign" },
      { ...campaign, id: 2, title: "Second campaign" },
      { ...campaign, id: 3, title: "Third campaign" },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.CampaignPhase.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
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
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBe(3);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, name: "First campaign" }),
        expect.objectContaining({ id: 2, name: "Second campaign" }),
        expect.objectContaining({ id: 3, name: "Third campaign" }),
      ])
    );
  });
  it("Should answer with a list of your campaigns if has partial access", async () => {
    const response = await request(app)
      .get("/campaigns")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,3]}');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBe(2);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, name: "First campaign" }),
        expect.objectContaining({ id: 3, name: "Third campaign" }),
      ])
    );
  });
});

describe("GET /campaigns with start and limit query params", () => {
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
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        id: 2,
        name: "test",
        surname: "test",
        email: "",
        wp_user_id: 2,
        education_id: 1,
        employment_id: 1,
      },
    ]);
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 1, title: "First campaign" },
      { ...campaign, id: 2, title: "Second campaign" },
      { ...campaign, id: 3, title: "Third campaign" },
      { ...campaign, id: 4, title: "Fourth campaign" },
      { ...campaign, id: 5, title: "Fifth campaign" },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.CampaignPhase.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
  });

  it("Should return all campaigns if no start and limit are passed", async () => {
    const response = await request(app)
      .get("/campaigns")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("items");
    expect(response.body).not.toHaveProperty("limit");
    expect(response.body).not.toHaveProperty("total");
    expect(response.body).toHaveProperty("start");
    expect(response.body).toHaveProperty("size");
    expect(response.body.items.length).toBe(5);
    expect(response.body.start).toBe(0);
    expect(response.body.size).toBe(5);
  });

  it("Should return the first 2 campaigns if limit=2", async () => {
    const response = await request(app)
      .get("/campaigns?limit=2")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("items");
    expect(response.body).toHaveProperty("limit");
    expect(response.body).toHaveProperty("start");
    expect(response.body).toHaveProperty("size");
    expect(response.body.items.length).toBe(2);
    expect(response.body.size).toBe(2);
    expect(response.body.limit).toBe(2);
    expect(response.body.start).toBe(0);
    expect(response.body.total).toBe(5);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 5, name: "Fifth campaign" }),
        expect.objectContaining({ id: 4, name: "Fourth campaign" }),
      ])
    );
  });

  it("Should return the campaigns starting from the third one if start=2", async () => {
    const response = await request(app)
      .get("/campaigns?start=2")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("items");
    expect(response.body).toHaveProperty("limit");
    expect(response.body).toHaveProperty("start");
    expect(response.body).toHaveProperty("size");
    expect(response.body.items.length).toBe(3);
    expect(response.body.size).toBe(3);
    expect(response.body.limit).toBe(10);
    expect(response.body.start).toBe(2);
    expect(response.body.total).toBe(5);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, name: "First campaign" }),
        expect.objectContaining({ id: 2, name: "Second campaign" }),
        expect.objectContaining({ id: 3, name: "Third campaign" }),
      ])
    );
  });
});
