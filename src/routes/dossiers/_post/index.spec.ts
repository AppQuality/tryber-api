import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

jest.mock("@src/features/wp/WordpressJsonApiTrigger");
jest.mock("@src/features/webhookTrigger");
const baseRequest = {
  project: 1,
  testType: 1,
  title: {
    customer: "Campaign Title for Customer",
    tester: "Campaign Title for Tester",
  },
  startDate: "2019-08-24T14:15:22Z",
  deviceList: [1],
};

describe("Route POST /dossiers", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqProject.do().insert({
      id: 1,
      display_name: "Test Project",
      customer_id: 1,
      edited_by: 1,
    });

    await tryber.tables.WpAppqCampaignType.do().insert({
      id: 1,
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
    ]);
  });

  afterAll(async () => {
    await tryber.tables.WpAppqProject.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
  });
  afterEach(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).post("/dossiers").send(baseRequest);
    expect(response.status).toBe(403);
  });

  it("Should answer 403 if not admin", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer tester")
      .send(baseRequest);
    console.log(response.body);
    expect(response.status).toBe(403);
  });

  it("Should answer 400 if project does not exists", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, project: 10 });
    expect(response.status).toBe(400);
  });

  it("Should answer 400 if test type does not exists", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, testType: 10 });
    expect(response.status).toBe(400);
  });

  it("Should answer 400 if device type does not exists", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, deviceList: [10] });
    expect(response.status).toBe(400);
  });

  it("Should answer 201 if admin", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send(baseRequest);
    expect(response.status).toBe(201);
  });
});
