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
  pm_id: 1,
  customer_title: "",
};
describe("GET /campaigns", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        ...campaign,
        id: 1,
        project_id: 1,
      },
    ]);
    await tryber.tables.WpAppqCustomer.do().insert([
      {
        id: 1,
        company: "Company 1",
        pm_id: 1,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqCustomer.do().delete();
  });

  afterEach(async () => {
    await tryber.tables.WpAppqProject.do().delete();
  });

  it("Should answer 403 if not logged in", () => {
    return request(app)
      .post("/customers/1/projects")
      .send({ name: "New project" })
      .expect(403);
  });
  it("Should answer 403 if logged in without permissions", async () => {
    const response = await request(app)
      .post("/customers/1/projects")
      .send({ name: "New project" })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should answer 403 if customer does not exists", async () => {
    const response = await request(app)
      .post("/customers/100/projects")
      .send({ name: "New project" })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(403);
  });
  it("Should answer 201 if logged as user with full access on campaigns", async () => {
    const response = await request(app)
      .post("/customers/1/projects")
      .send({ name: "New project" })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(201);
  });
  it("Should answer 403 if logged as user with access to some campaigns", async () => {
    const response = await request(app)
      .post("/customers/1/projects")
      .send({ name: "New project" })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,2]}');
    expect(response.status).toBe(403);
  });

  it("Should add projects to the customer", async () => {
    const postResponse = await request(app)
      .post("/customers/1/projects")
      .send({ name: "New project" })
      .set("Authorization", "Bearer admin");

    expect(postResponse.status).toBe(201);
    expect(postResponse.body).toHaveProperty("id");
    expect(postResponse.body).toHaveProperty("name");
    const { id, name } = postResponse.body;

    const getResponse = await request(app)
      .get("/customers/1/projects")
      .set("Authorization", "Bearer admin");

    expect(getResponse.status).toBe(200);

    const projects = getResponse.body.results;
    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe(id);
    expect(projects[0].name).toBe(name);
  });
});
