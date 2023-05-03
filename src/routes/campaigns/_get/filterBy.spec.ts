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
      { ...campaign, id: 1, title: "First campaign", project_id: 1 },
      { ...campaign, id: 2, title: "Second campaign", project_id: 3 },
      { ...campaign, id: 3, title: "Third campaign", project_id: 2 },
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

  it("Should return total based on filter", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[customer]=1,2&limit=10")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    console.log(response.body);
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.total).toBe(2);
  });
});
