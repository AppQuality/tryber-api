import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const campaign = {
  platform_id: 1,
  start_date: "2023-01-13 10:10:10",
  end_date: "2023-01-14 10:10:10",
  title: "",
  page_preview_id: 1,
  page_manual_id: 1,
  customer_id: 1,
  pm_id: 1,
  customer_title: "",
};
const project = {
  display_name: "",
  edited_by: 1,
};
describe("GET /campaigns", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        ...campaign,
        id: 1,
        project_id: 1,
      },
      {
        ...campaign,
        id: 2,
        project_id: 2,
      },
      {
        ...campaign,
        id: 3,
        project_id: 3,
      },
    ]);
    await tryber.tables.WpAppqProject.do().insert([
      {
        ...project,
        display_name: "Project 1",
        id: 1,
        customer_id: 1,
      },
      {
        ...project,
        display_name: "Project 2",
        id: 2,
        customer_id: 1,
      },
      {
        ...project,
        display_name: "Project 3",
        id: 3,
        customer_id: 2,
      },
    ]);
    await tryber.tables.WpAppqCustomer.do().insert([
      {
        id: 1,
        company: "Company 1",
        pm_id: 1,
      },
      {
        id: 2,
        company: "Company 2",
        pm_id: 1,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqCustomer.do().delete();
  });

  it("Should answer 403 if not logged in", () => {
    return request(app).get("/customers/1/projects").expect(403);
  });
  it("Should answer 403 if logged in without permissions", async () => {
    const response = await request(app)
      .get("/customers/1/projects")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should answer 403 if customer does not exists", async () => {
    const response = await request(app)
      .get("/customers/100/projects")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged as user with full access on campaigns", async () => {
    const response = await request(app)
      .get("/customers/1/projects")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
  });
  it("Should answer 403 if logged as user with access to some campaigns", async () => {
    const response = await request(app)
      .get("/customers/1/projects")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,2]}');
    expect(response.status).toBe(403);
  });
  it("Should answer with a list of all projects of the customer if has full access", async () => {
    const response = await request(app)
      .get("/customers/1/projects")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(Array.isArray(response.body.results)).toBe(true);
    expect(response.body.results.length).toBe(2);
    expect(response.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, name: "Project 1" }),
        expect.objectContaining({ id: 2, name: "Project 2" }),
      ])
    );
  });
});
