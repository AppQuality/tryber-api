import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

describe("DELETE /campaigns/campaignId/finance/otherCosts", () => {
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
        name: "Jane",
        surname: "Doe",
        wp_user_id: 2,
        email: "",
        employment_id: 1,
        education_id: 1,
      },
    ]);
    await tryber.tables.WpUsers.do().insert([{ ID: 1 }, { ID: 2 }]);
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
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
      },
      {
        id: 2,
        platform_id: 1,
        start_date: "2020-01-01",
        end_date: "2020-01-01",
        title: "Another campaign",
        page_preview_id: 1,
        page_manual_id: 1,
        customer_id: 1,
        pm_id: 1,
        project_id: 1,
        customer_title: "",
      },
    ]);
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
        created_by: 1,
        created_on: "2024-01-02 11:00:00",
      },
    ]);
  });

  afterEach(async () => {
    await tryber.tables.WpAppqCampaignOtherCostsAttachment.do().delete();
    await tryber.tables.WpAppqCampaignOtherCosts.do().delete();
  });

  afterAll(async () => {
    await tryber.tables.WpAppqCampaignOtherCostsSupplier.do().delete();
    await tryber.tables.WpAppqCampaignOtherCostsType.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpUsers.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
  });

  describe("Authentication and Authorization", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert({
        id: 1,
        campaign_id: 1,
        description: "Cost to delete",
        cost: 100.0,
        type_id: 1,
        supplier_id: 1,
      });
    });

    it("Should return 403 if user is not authenticated", async () => {
      const response = await request(app)
        .delete("/campaigns/1/finance/otherCosts")
        .send({ cost_id: 1 });
      expect(response.status).toBe(403);
    });

    it("Should return 403 if user does not have access to campaign", async () => {
      const response = await request(app)
        .delete("/campaigns/1/finance/otherCosts")
        .send({ cost_id: 1 })
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[2]}');
      expect(response.status).toBe(403);
    });

    it("Should return 200 if logged in as admin", async () => {
      const response = await request(app)
        .delete("/campaigns/1/finance/otherCosts")
        .send({ cost_id: 1 })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(200);
    });

    it("Should return 200 if logged in as olp with access to campaign", async () => {
      const response = await request(app)
        .delete("/campaigns/1/finance/otherCosts")
        .send({ cost_id: 1 })
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
      expect(response.status).toBe(200);
    });
  });

  describe("Input Validation", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert({
        id: 1,
        campaign_id: 1,
        description: "Cost to delete",
        cost: 100.0,
        type_id: 1,
        supplier_id: 1,
      });
    });

    it("Should return 400 if cost_id is missing", async () => {
      const response = await request(app)
        .delete("/campaigns/1/finance/otherCosts")
        .send({})
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);

      expect(response.body.err).toBeDefined();
    });

    it("Should return 400 if cost_id is null", async () => {
      const response = await request(app)
        .delete("/campaigns/1/finance/otherCosts")
        .send({ cost_id: null })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);

      expect(response.body.err).toBeDefined();
    });

    it("Should return 400 if cost_id is not a number", async () => {
      const response = await request(app)
        .delete("/campaigns/1/finance/otherCosts")
        .send({ cost_id: "invalid" })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);

      expect(response.body.err).toBeDefined();
    });

    it("Should return 400 if cost_id is zero", async () => {
      const response = await request(app)
        .delete("/campaigns/1/finance/otherCosts")
        .send({ cost_id: 0 })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: "cost_id must be a positive number",
        })
      );
    });

    it("Should return 400 if cost_id is negative", async () => {
      const response = await request(app)
        .delete("/campaigns/1/finance/otherCosts")
        .send({ cost_id: -1 })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: "cost_id must be a positive number",
        })
      );
    });
  });

  describe("Not Found ", () => {
    it("Should return 404 if cost does not exist", async () => {
      const response = await request(app)
        .delete("/campaigns/1/finance/otherCosts")
        .send({ cost_id: 999 })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(404);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: "Cost not found for this campaign",
        })
      );
    });

    it("Should return 404 if cost belongs to another campaign", async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert({
        id: 10,
        campaign_id: 2,
        description: "Cost for another campaign",
        cost: 50.0,
        type_id: 1,
        supplier_id: 1,
      });

      const response = await request(app)
        .delete("/campaigns/1/finance/otherCosts")
        .send({ cost_id: 10 })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(404);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: "Cost not found for this campaign",
        })
      );
    });
  });

  describe("Success - admin permissions", () => {
    it("Should delete cost from database", async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert({
        id: 1,
        campaign_id: 1,
        description: "Cost to delete",
        cost: 100.0,
        type_id: 1,
        supplier_id: 1,
      });

      const response = await request(app)
        .delete("/campaigns/1/finance/otherCosts")
        .send({ cost_id: 1 })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(200);

      const costs = await tryber.tables.WpAppqCampaignOtherCosts.do()
        .where({ id: 1 })
        .select();
      expect(costs).toHaveLength(0);

      const getResponse = await request(app)
        .get("/campaigns/1/finance/otherCosts")
        .set("Authorization", "Bearer admin");
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items).toHaveLength(0);
    });

    it("Should delete cost and all its attachments", async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert({
        id: 1,
        campaign_id: 1,
        description: "Cost with attachments",
        cost: 100.0,
        type_id: 1,
        supplier_id: 1,
      });

      await tryber.tables.WpAppqCampaignOtherCostsAttachment.do().insert([
        {
          id: 1,
          cost_id: 1,
          url: "https://example.com/attachment1.pdf",
          mime_type: "application/pdf",
        },
        {
          id: 2,
          cost_id: 1,
          url: "https://example.com/attachment2.jpg",
          mime_type: "image/jpeg",
        },
        {
          id: 3,
          cost_id: 1,
          url: "https://example.com/attachment3.png",
          mime_type: "image/png",
        },
      ]);

      const response = await request(app)
        .delete("/campaigns/1/finance/otherCosts")
        .send({ cost_id: 1 })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(200);

      const costs = await tryber.tables.WpAppqCampaignOtherCosts.do()
        .where({ id: 1 })
        .select();
      expect(costs).toHaveLength(0);

      const attachments =
        await tryber.tables.WpAppqCampaignOtherCostsAttachment.do()
          .where({ cost_id: 1 })
          .select();
      expect(attachments).toHaveLength(0);

      const getResponse = await request(app)
        .get("/campaigns/1/finance/otherCosts")
        .set("Authorization", "Bearer admin");
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items).toHaveLength(0);
    });

    it("Should only delete specified cost, not others", async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert([
        {
          id: 1,
          campaign_id: 1,
          description: "Cost to delete",
          cost: 100.0,
          type_id: 1,
          supplier_id: 1,
        },
        {
          id: 2,
          campaign_id: 1,
          description: "Cost to keep",
          cost: 200.0,
          type_id: 2,
          supplier_id: 2,
        },
      ]);

      const response = await request(app)
        .delete("/campaigns/1/finance/otherCosts")
        .send({ cost_id: 1 })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(200);

      const cost1 = await tryber.tables.WpAppqCampaignOtherCosts.do()
        .where({ id: 1 })
        .select();
      expect(cost1).toHaveLength(0);

      const cost2 = await tryber.tables.WpAppqCampaignOtherCosts.do()
        .where({ id: 2 })
        .select();
      expect(cost2).toHaveLength(1);

      const getResponse = await request(app)
        .get("/campaigns/1/finance/otherCosts")
        .set("Authorization", "Bearer admin");
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items).toHaveLength(1);
      expect(getResponse.body.items[0]).toEqual(
        expect.objectContaining({
          cost_id: 2,
          description: "Cost to keep",
        })
      );
    });

    it("Should only delete attachments of the deleted cost", async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert([
        {
          id: 1,
          campaign_id: 1,
          description: "Cost to delete",
          cost: 100.0,
          type_id: 1,
          supplier_id: 1,
        },
        {
          id: 2,
          campaign_id: 1,
          description: "Cost to keep",
          cost: 200.0,
          type_id: 2,
          supplier_id: 2,
        },
      ]);

      await tryber.tables.WpAppqCampaignOtherCostsAttachment.do().insert([
        {
          id: 1,
          cost_id: 1,
          url: "https://example.com/delete1.pdf",
          mime_type: "application/pdf",
        },
        {
          id: 2,
          cost_id: 1,
          url: "https://example.com/delete2.jpg",
          mime_type: "image/jpeg",
        },
        {
          id: 3,
          cost_id: 2,
          url: "https://example.com/keep.png",
          mime_type: "image/png",
        },
      ]);

      const response = await request(app)
        .delete("/campaigns/1/finance/otherCosts")
        .send({ cost_id: 1 })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(200);

      const attachmentsCost1 =
        await tryber.tables.WpAppqCampaignOtherCostsAttachment.do()
          .where({ cost_id: 1 })
          .select();
      expect(attachmentsCost1).toHaveLength(0);

      const attachmentsCost2 =
        await tryber.tables.WpAppqCampaignOtherCostsAttachment.do()
          .where({ cost_id: 2 })
          .select();
      expect(attachmentsCost2).toHaveLength(1);
      expect(attachmentsCost2[0]).toEqual(
        expect.objectContaining({
          id: 3,
          url: "https://example.com/keep.png",
        })
      );

      const getResponse = await request(app)
        .get("/campaigns/1/finance/otherCosts")
        .set("Authorization", "Bearer admin");
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items).toHaveLength(1);
      expect(getResponse.body.items[0]).toEqual(
        expect.objectContaining({
          cost_id: 2,
          description: "Cost to keep",
          attachments: expect.arrayContaining([
            expect.objectContaining({
              id: 3,
              url: "https://example.com/keep.png",
              mimetype: "image/png",
            }),
          ]),
        })
      );
    });

    it("Should delete cost without attachments", async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert({
        id: 1,
        campaign_id: 1,
        description: "Cost without attachments",
        cost: 100.0,
        type_id: 1,
        supplier_id: 1,
      });

      const response = await request(app)
        .delete("/campaigns/1/finance/otherCosts")
        .send({ cost_id: 1 })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(200);

      const costs = await tryber.tables.WpAppqCampaignOtherCosts.do()
        .where({ id: 1 })
        .select();
      expect(costs).toHaveLength(0);

      const getResponse = await request(app)
        .get("/campaigns/1/finance/otherCosts")
        .set("Authorization", "Bearer admin");
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items).toHaveLength(0);
    });

    it("Should delete correctly only one cost item", async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert([
        {
          id: 1,
          campaign_id: 1,
          description: "Cost to delete",
          cost: 100.0,
          type_id: 1,
          supplier_id: 1,
        },
        {
          id: 2,
          campaign_id: 1,
          description: "Cost to keep",
          cost: 200.0,
          type_id: 2,
          supplier_id: 2,
        },
      ]);

      const deleteResponse = await request(app)
        .delete("/campaigns/1/finance/otherCosts")
        .send({ cost_id: 1 })
        .set("Authorization", "Bearer admin");
      expect(deleteResponse.status).toBe(200);

      const getResponse = await request(app)
        .get("/campaigns/1/finance/otherCosts")
        .set("Authorization", "Bearer admin");
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items).toHaveLength(1);
      expect(getResponse.body.items[0]).toEqual(
        expect.objectContaining({
          cost_id: 2,
          description: "Cost to keep",
        })
      );
    });
  });

  describe("Success - olp permissions", () => {
    it("Should delete cost with olp permissions", async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert({
        id: 1,
        campaign_id: 1,
        description: "Cost to delete",
        cost: 100.0,
        type_id: 1,
        supplier_id: 1,
      });

      const response = await request(app)
        .delete("/campaigns/1/finance/otherCosts")
        .send({ cost_id: 1 })
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
      expect(response.status).toBe(200);

      const costs = await tryber.tables.WpAppqCampaignOtherCosts.do()
        .where({ id: 1 })
        .select();
      expect(costs).toHaveLength(0);

      const getResponse = await request(app)
        .get("/campaigns/1/finance/otherCosts")
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items).toHaveLength(0);
    });

    it("Should delete cost and attachments ", async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert({
        id: 1,
        campaign_id: 1,
        description: "Cost with attachments",
        cost: 100.0,
        type_id: 1,
        supplier_id: 1,
      });

      await tryber.tables.WpAppqCampaignOtherCostsAttachment.do().insert([
        {
          id: 1,
          cost_id: 1,
          url: "https://example.com/attachment1.pdf",
          mime_type: "application/pdf",
        },
        {
          id: 2,
          cost_id: 1,
          url: "https://example.com/attachment2.jpg",
          mime_type: "image/jpeg",
        },
      ]);

      const response = await request(app)
        .delete("/campaigns/1/finance/otherCosts")
        .send({ cost_id: 1 })
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
      expect(response.status).toBe(200);

      const costs = await tryber.tables.WpAppqCampaignOtherCosts.do()
        .where({ id: 1 })
        .select();
      expect(costs).toHaveLength(0);

      const attachments =
        await tryber.tables.WpAppqCampaignOtherCostsAttachment.do()
          .where({ cost_id: 1 })
          .select();
      expect(attachments).toHaveLength(0);

      const getResponse = await request(app)
        .get("/campaigns/1/finance/otherCosts")
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items).toHaveLength(0);
    });

    it("Should delete correctly only one cost item", async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert([
        {
          id: 1,
          campaign_id: 1,
          description: "Cost to delete",
          cost: 100.0,
          type_id: 1,
          supplier_id: 1,
        },
        {
          id: 2,
          campaign_id: 1,
          description: "Cost to keep",
          cost: 200.0,
          type_id: 2,
          supplier_id: 2,
        },
      ]);

      const deleteResponse = await request(app)
        .delete("/campaigns/1/finance/otherCosts")
        .send({ cost_id: 1 })
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
      expect(deleteResponse.status).toBe(200);

      const getResponse = await request(app)
        .get("/campaigns/1/finance/otherCosts")
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items).toHaveLength(1);
      expect(getResponse.body.items[0]).toEqual(
        expect.objectContaining({
          cost_id: 2,
          description: "Cost to keep",
        })
      );
    });
  });
});
