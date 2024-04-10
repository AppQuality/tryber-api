import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const baseRequest = {
  project: 10,
  testType: 10,
  title: {
    customer: "Campaign Title for Customer",
    tester: "Campaign Title for Tester",
  },
  startDate: "2019-08-24T14:15:22Z",
  deviceList: [1],
};

describe("Route POST /dossiers", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqCustomer.do().insert({
      id: 1,
      company: "Test Company",
      pm_id: 1,
    });
    await tryber.tables.WpAppqProject.do().insert({
      id: 10,
      display_name: "Test Project",
      customer_id: 1,
      edited_by: 1,
    });

    await tryber.tables.WpAppqCampaignType.do().insert({
      id: 10,
      name: "Test Type",
      description: "Test Description",
      category_id: 1,
    });

    await tryber.tables.WpAppqEvdPlatform.do().insert([
      {
        id: 1,
        name: "Test Type",
        form_factor: 0,
        architecture: 1,
      },
      {
        id: 2,
        name: "Test Type",
        form_factor: 1,
        architecture: 1,
      },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.WpAppqCustomer.do().delete();
    await tryber.tables.WpAppqProject.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
  });
  afterEach(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
  });

  it("Should create a campaign", async () => {
    const postResponse = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send(baseRequest);

    expect(postResponse.status).toBe(201);
    expect(postResponse.body).toHaveProperty("id");

    const getResponse = await request(app)
      .get(`/campaigns/${postResponse.body.id}`)
      .set("authorization", "Bearer admin");

    expect(getResponse.status).toBe(200);
  });

  it("Should create a campaign linked to the specified project", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, project: 10 });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("project_id", 10);
  });

  it("Should create a campaign linked to the specified test type", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, testType: 10 });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("campaign_type_id", 10);
  });

  it("Should create a campaign with the specified title", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        title: { ...baseRequest.title, tester: "new title" },
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("title", "new title");
  });
  it("Should create a campaign with the specified customer title", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        title: { ...baseRequest.title, customer: "new title" },
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("customer_title", "new title");
  });

  it("Should create a campaign with the specified start date", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        startDate: "2021-08-24T14:15:22Z",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("start_date", "2021-08-24T14:15:22Z");
  });

  it("Should create a campaign with the specified end date ", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        endDate: "2021-08-20T14:15:22Z",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("end_date", "2021-08-20T14:15:22Z");
  });

  it("Should create a campaign with the end date as start date + 7 if left unspecified", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        startDate: "2021-08-20T14:15:22Z",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("end_date", "2021-08-27T14:15:22Z");
  });

  it("Should create a campaign with current user as pm_id if left unspecified", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send(baseRequest);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("pm_id", 1);
  });

  it("Should create a campaign with current user as pm_id if specified", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, csm: 2 });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("pm_id", 2);
  });

  it("Should create a campaign with the specified device list", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, deviceList: [1, 2] });

    expect(response.status).toBe(201);

    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("os", "1,2");
    expect(campaign).toHaveProperty("form_factor", "0,1");
  });
});