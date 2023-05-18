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
    await tryber.tables.WpAppqCampaignType.do().insert([
      {
        id: 1,
        name: "Campaign Type 1",
        category_id: 1,
      },
      {
        id: 2,
        name: "Campaign Type 2",
        category_id: 1,
      },
      {
        id: 3,
        name: "Campaign Type 3",
        category_id: 1,
      },
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
    await tryber.tables.WpAppqProject.do().insert([
      {
        id: 1,
        display_name: "Project 1",
        customer_id: 1,
        edited_by: 1,
      },
    ]);
    await tryber.tables.WpAppqProject.do().insert([
      {
        id: 2,
        display_name: "Project 2",
        customer_id: 2,
        edited_by: 1,
      },
    ]);
    await tryber.tables.WpAppqProject.do().insert([
      {
        id: 3,
        display_name: "Project 3",
        customer_id: 3,
        edited_by: 1,
      },
    ]);
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        ...campaign,
        id: 1,
        title: "First campaign",
        project_id: 1,
        status_id: 1,
        campaign_type_id: 1,
      },
      {
        ...campaign,
        id: 2,
        title: "Second campaign",
        project_id: 3,
        start_date: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        status_id: 1,
        campaign_type_id: 2,
      },
      {
        ...campaign,
        id: 3,
        title: "Third campaign",
        project_id: 2,
        status_id: 2,
        campaign_type_id: 3,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
  });

  it("Should return only campaigns of specific customers if filterBy is set", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[customer]=1,2")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, name: "First campaign" }),
        expect.objectContaining({ id: 3, name: "Third campaign" }),
      ])
    );
  });

  it("Should return total based on filter customer", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[customer]=1,2&limit=10")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.total).toBe(2);
  });

  it("Should return only campaigns closed if filterBy is set", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[status]=closed")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 3, name: "Third campaign" }),
      ])
    );
  });
  it("Should return total based on filter status closed", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[status]=closed&limit=10")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.total).toBe(1);
  });

  it("Should return only campaigns running if filterBy is set", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[status]=running")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, name: "First campaign" }),
      ])
    );
  });
  it("Should return total based on filter status running", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[status]=running&limit=10")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.total).toBe(1);
  });

  it("Should return only campaigns incoming if filterBy is set", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[status]=incoming")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 2, name: "Second campaign" }),
      ])
    );
  });
  it("Should return total based on filter status incoming", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[status]=incoming&limit=10")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.total).toBe(1);
  });
  it("Should return only campaigns of specific type if filterBy is set", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[type]=1,3")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, name: "First campaign" }),
        expect.objectContaining({ id: 3, name: "Third campaign" }),
      ])
    );
  });

  it("Should return total based on filter", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[type]=1,3&limit=10")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.total).toBe(2);
  });
});
