import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

describe("GET /campaigns/campaignId/finance/type", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        id: 1,
        name: "John",
        surname: "Doe",
        wp_user_id: 1,
        email: "",
        employment_id: 1,
        education_id: 1,
      },
    ]);
    await tryber.tables.WpUsers.do().insert({ ID: 1 });
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 1,
      platform_id: 1,
      start_date: "2020-01-01",
      end_date: "2020-01-01",
      title: "This is the title",
      page_preview_id: 1,
      page_manual_id: 1,
      customer_id: 1,
      pm_id: 1,
      project_id: 1,
      customer_title: "",
    });
    await tryber.tables.WpAppqCampaignOtherCostsType.do().insert([
      {
        id: 1,
        name: "Type 1",
      },
      {
        id: 2,
        name: "Type 2",
      },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.WpAppqCampaignOtherCostsType.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpUsers.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
  });

  it("Should return 403 if logged out", async () => {
    const response = await request(app).get("/campaigns/1/finance/type");
    expect(response.status).toBe(403);
  });

  it("Should return 403 if logged in as not admin user", async () => {
    const response = await request(app)
      .get("/campaigns/1/finance/type")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 403 if no access to the campaign", async () => {
    const response = await request(app)
      .get("/campaigns/1/finance/type")
      .set("Authorization", 'Bearer tester"');
    expect(response.status).toBe(403);
  });

  it("Should return 200 if logged in as admin", async () => {
    const response = await request(app)
      .get("/campaigns/1/finance/type")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should return finance types - admin", async () => {
    const response = await request(app)
      .get("/campaigns/1/finance/type")
      .set("Authorization", "Bearer admin");
    expect(response.body).toEqual(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({
            name: "Type 1",
          }),
          expect.objectContaining({
            name: "Type 2",
          }),
        ]),
      })
    );
    expect(response.body.items).toHaveLength(2);
  });

  it("Should return types - olp permissions", async () => {
    const response = await request(app)
      .get("/campaigns/1/finance/type")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({
            name: "Type 1",
          }),
          expect.objectContaining({
            name: "Type 2",
          }),
        ]),
      })
    );
    expect(response.body.items).toHaveLength(2);
  });
});
