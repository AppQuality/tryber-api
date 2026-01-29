import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";
import { after } from "node:test";

describe("GET /campaigns/campaignId/finance/supplier", () => {
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
      {
        id: 2,
        name: "John",
        surname: "Doe",
        wp_user_id: 2,
        email: "",
        employment_id: 1,
        education_id: 1,
      },
    ]);
    await tryber.tables.WpUsers.do().insert([{ ID: 1 }, { ID: 2 }]);
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
    await tryber.tables.WpAppqCampaignOtherCostsSupplier.do().insert([
      {
        id: 1,
        name: "Supplier 1",
        created_by: 1,
        created_on: "2024-01-01 10:00:00",
      },
      {
        id: 2,
        name: "Supplier 2",
        created_by: 2,
        created_on: "2024-01-02 11:00:00",
      },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.WpAppqCampaignOtherCostsSupplier.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpUsers.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
  });

  it("Should return 403 if logged out", async () => {
    const response = await request(app).get("/campaigns/1/finance/supplier");
    expect(response.status).toBe(403);
  });

  it("Should return 403 if logged in as not admin user", async () => {
    const response = await request(app)
      .get("/campaigns/1/finance/supplier")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 403 if no access to the campaign", async () => {
    const response = await request(app)
      .get("/campaigns/1/finance/supplier")
      .set("Authorization", 'Bearer tester"');
    expect(response.status).toBe(403);
  });

  it("Should return 200 if logged in as admin", async () => {
    const response = await request(app)
      .get("/campaigns/1/finance/supplier")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should return finance suppliers - admin", async () => {
    const response = await request(app)
      .get("/campaigns/1/finance/supplier")
      .set("Authorization", "Bearer admin");
    expect(response.body).toEqual(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            name: "Supplier 1",
            created_by: 1,
            created_on: "2024-01-01 10:00:00",
          }),
          expect.objectContaining({
            id: 2,
            name: "Supplier 2",
            created_by: 2,
            created_on: "2024-01-02 11:00:00",
          }),
        ]),
      })
    );
    expect(response.body.items).toHaveLength(2);
  });

  it("Should return suppliers - olp permissions", async () => {
    const response = await request(app)
      .get("/campaigns/1/finance/supplier")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            name: "Supplier 1",
            created_by: 1,
            created_on: "2024-01-01 10:00:00",
          }),
          expect.objectContaining({
            id: 2,
            name: "Supplier 2",
            created_by: 2,
            created_on: "2024-01-02 11:00:00",
          }),
        ]),
      })
    );
    expect(response.body.items).toHaveLength(2);
  });
});
