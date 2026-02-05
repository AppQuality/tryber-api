import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

describe("POST /campaigns/campaignId/finance/supplier", () => {
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
  });

  beforeEach(async () => {
    await tryber.tables.WpAppqCampaignOtherCostsSupplier.do().insert([
      {
        id: 1,
        name: "Supplier 1",
        created_by: 1,
        created_on: "2024-01-01 10:00:00",
      },
    ]);
  });

  afterEach(async () => {
    await tryber.tables.WpAppqCampaignOtherCostsSupplier.do().delete();
  });

  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpUsers.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
  });

  describe("Not enough permissions", () => {
    it("Should return 403 if logged out", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/supplier")
        .send({ name: "New Supplier" });
      expect(response.status).toBe(403);
    });

    it("Should return 403 if logged in as not admin user", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/supplier")
        .send({ name: "New Supplier" })
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(403);
    });

    it("Should return 403 if no access to the campaign", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/supplier")
        .send({ name: "New Supplier" })
        .set("Authorization", 'Bearer tester"');
      expect(response.status).toBe(403);
    });
  });

  describe("Enough permissions - admin", () => {
    it("Should return 200 if logged in as admin", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/supplier")
        .send({ name: "New Supplier" })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(201);
    });

    it("Should add new finance supplier", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/supplier")
        .send({ name: "New Supplier" })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ supplier_id: expect.any(Number) });
    });
    it("Should not add existing supplier", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/supplier")
        .send({ name: "Supplier 1" })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);
    });

    it("Should not add supplier with empty name", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/supplier")
        .send({ name: "   " })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: "Supplier name should not be empty",
        })
      );
    });
  });

  describe("Enough permissions - olp", () => {
    it("Should add supplier ", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/supplier")
        .send({ name: "New Supplier" })
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ supplier_id: expect.any(Number) });
    });

    it("Should not add existing supplier", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/supplier")
        .send({ name: "Supplier 1" })
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
      expect(response.status).toBe(400);
    });
  });
});
