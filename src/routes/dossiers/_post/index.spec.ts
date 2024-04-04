import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const baseRequest = {
  customer: 1,
  project: 1,
  testType: 1,
  title: {
    customer: "Campaign Title for Customer",
    tester: "Campaign Title for Tester",
  },
  startDate: "2019-08-24T14:15:22Z",
  deviceList: [1, 5, 10, 36],
};

describe("Route POST /dossiers", () => {
  beforeAll(async () => {});

  afterAll(async () => {});
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
});
