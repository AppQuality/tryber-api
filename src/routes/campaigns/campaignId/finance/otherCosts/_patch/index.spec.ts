import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";
import deleteFromS3 from "@src/features/deleteFromS3";

jest.mock("@src/features/deleteFromS3");

describe("PATCH /campaigns/campaignId/finance/otherCosts", () => {
  beforeAll(async () => {
    (deleteFromS3 as jest.Mock).mockResolvedValue(undefined);

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
      {
        id: 3,
        name: "Type 3",
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
      {
        id: 105,
        name: "Supplier 105",
        created_by: 1,
        created_on: "2024-01-03 12:00:00",
      },
    ]);
  });

  afterEach(async () => {
    await tryber.tables.WpAppqCampaignOtherCostsAttachment.do().delete();
    await tryber.tables.WpAppqCampaignOtherCosts.do().delete();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await tryber.tables.WpAppqCampaignOtherCostsSupplier.do().delete();
    await tryber.tables.WpAppqCampaignOtherCostsType.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpUsers.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
  });

  const validPayload = {
    description: "Riparazione hardware ufficio",
    type_id: 3,
    cost_id: 1,
    supplier_id: 105,
    cost: 250.5,
    attachments: [
      {
        url: "https://esempio.com/documenti/fattura.pdf",
        mime_type: "application/pdf",
      },
      {
        url: "https://esempio.com/immagini/danno.jpg",
        mime_type: "image/jpeg",
      },
    ],
  };

  describe("Authentication and Authorization", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert({
        id: 1,
        campaign_id: 1,
        description: "Original cost",
        cost: 100.0,
        type_id: 1,
        supplier_id: 1,
      });
    });

    it("Should return 403 if user is not logged in", async () => {
      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send(validPayload);
      expect(response.status).toBe(403);
    });

    it("Should return 403 if user is not admin and does not have olp permissions", async () => {
      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(403);
    });

    it("Should return 403 if user has olp permissions for different campaign", async () => {
      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[2]}');
      expect(response.status).toBe(403);
    });

    it("Should allow access with admin permissions", async () => {
      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(200);
    });

    it("Should allow access with olp permissions for the campaign", async () => {
      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
      expect(response.status).toBe(200);
    });
  });

  describe("Input Validation", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert({
        id: 1,
        campaign_id: 1,
        description: "Original cost",
        cost: 100.0,
        type_id: 1,
        supplier_id: 1,
      });
    });

    it("Should return 400 if cost_id is missing", async () => {
      const { cost_id, ...payload } = validPayload;

      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send(payload)
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);
      expect(response.body.err).toBeDefined();
    });

    it("Should return 400 if cost_id is null", async () => {
      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send({ ...validPayload, cost_id: null })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);
      expect(response.body.err).toBeDefined();
    });

    it("Should return 400 if cost_id is zero", async () => {
      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send({ ...validPayload, cost_id: 0 })
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
        .patch("/campaigns/1/finance/otherCosts")
        .send({ ...validPayload, cost_id: -1 })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: "cost_id must be a positive number",
        })
      );
    });

    it("Should return 400 if description is missing", async () => {
      const { description, ...payload } = validPayload;

      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send(payload)
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);
      expect(response.body.err).toBeDefined();
    });

    it("Should return 400 if type_id is missing", async () => {
      const { type_id, ...payload } = validPayload;

      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send(payload)
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);
      expect(response.body.err).toBeDefined();
    });

    it("Should return 400 if supplier_id is missing", async () => {
      const { supplier_id, ...payload } = validPayload;

      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send(payload)
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);
      expect(response.body.err).toBeDefined();
    });

    it("Should return 400 if cost is missing", async () => {
      const { cost, ...payload } = validPayload;

      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send(payload)
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);
      expect(response.body.err).toBeDefined();
    });

    it("Should return 400 if attachments is missing", async () => {
      const { attachments, ...payload } = validPayload;

      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send(payload)
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);
      expect(response.body.err).toBeDefined();
    });

    it("Should return 400 if attachments array item is missing url", async () => {
      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send({
          ...validPayload,
          attachments: [{ mime_type: "application/pdf" }],
        })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);
      expect(response.body.err).toBeDefined();
    });

    it("Should return 400 if attachments array item is missing mime_type", async () => {
      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send({
          ...validPayload,
          attachments: [{ url: "https://example.com/file.pdf" }],
        })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);
      expect(response.body.err).toBeDefined();
    });
  });

  describe("Resource Validation", () => {
    it("Should return 404 if cost_id does not exist", async () => {
      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send({ ...validPayload, cost_id: 999 })
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
        .patch("/campaigns/1/finance/otherCosts")
        .send({ ...validPayload, cost_id: 10 })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(404);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: "Cost not found for this campaign",
        })
      );
    });

    it("Should return 404 if type_id does not exist", async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert({
        id: 1,
        campaign_id: 1,
        description: "Original cost",
        cost: 100.0,
        type_id: 1,
        supplier_id: 1,
      });

      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send({ ...validPayload, type_id: 999 })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(404);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: "Type not found",
        })
      );
    });

    it("Should return 404 if supplier_id does not exist", async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert({
        id: 1,
        campaign_id: 1,
        description: "Original cost",
        cost: 100.0,
        type_id: 1,
        supplier_id: 1,
      });

      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send({ ...validPayload, supplier_id: 999 })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(404);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: "Supplier not found",
        })
      );
    });
  });

  describe("Success - admin permissions", () => {
    it("Should update cost in database", async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert({
        id: 1,
        campaign_id: 1,
        description: "Original cost",
        cost: 100.0,
        type_id: 1,
        supplier_id: 1,
      });

      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(200);

      const updatedCost = await tryber.tables.WpAppqCampaignOtherCosts.do()
        .where({ id: 1 })
        .first();

      expect(updatedCost).toEqual(
        expect.objectContaining({
          id: 1,
          campaign_id: 1,
          description: "Riparazione hardware ufficio",
          cost: 250.5,
          type_id: 3,
          supplier_id: 105,
        })
      );
    });

    it("Should update cost and replace attachments", async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert({
        id: 1,
        campaign_id: 1,
        description: "Original cost",
        cost: 100.0,
        type_id: 1,
        supplier_id: 1,
      });

      await tryber.tables.WpAppqCampaignOtherCostsAttachment.do().insert([
        {
          id: 1,
          cost_id: 1,
          url: "https://old.com/old1.pdf",
          mime_type: "application/pdf",
        },
        {
          id: 2,
          cost_id: 1,
          url: "https://old.com/old2.jpg",
          mime_type: "image/jpeg",
        },
      ]);

      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(200);

      const attachments =
        await tryber.tables.WpAppqCampaignOtherCostsAttachment.do()
          .where({ cost_id: 1 })
          .select();

      expect(attachments).toHaveLength(2);
      expect(attachments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            cost_id: 1,
            url: "https://esempio.com/documenti/fattura.pdf",
            mime_type: "application/pdf",
          }),
          expect.objectContaining({
            cost_id: 1,
            url: "https://esempio.com/immagini/danno.jpg",
            mime_type: "image/jpeg",
          }),
        ])
      );

      const getResponse = await request(app)
        .get("/campaigns/1/finance/otherCosts")
        .set("Authorization", "Bearer admin");
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items).toHaveLength(1);
      expect(getResponse.body.items[0]).toEqual(
        expect.objectContaining({
          cost_id: 1,
          description: "Riparazione hardware ufficio",
          cost: 250.5,
          type: {
            name: "Type 3",
            id: 3,
          },
          supplier: {
            name: "Supplier 105",
            id: 105,
          },
        })
      );
      expect(getResponse.body.items[0].attachments).toHaveLength(2);
    });

    it("Should delete old attachments from S3 when updating", async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert({
        id: 1,
        campaign_id: 1,
        description: "Original cost",
        cost: 100.0,
        type_id: 1,
        supplier_id: 1,
      });

      await tryber.tables.WpAppqCampaignOtherCostsAttachment.do().insert({
        id: 1,
        cost_id: 1,
        url: "https://s3.eu-west-1.amazonaws.com/bucket/old-file.pdf",
        mime_type: "application/pdf",
      });

      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(200);
      expect(deleteFromS3).toHaveBeenCalledTimes(1);
      expect(deleteFromS3).toHaveBeenCalledWith({
        url: "https://s3.eu-west-1.amazonaws.com/bucket/old-file.pdf",
      });
    });

    it("Should delete multiple old attachments from S3 when updating", async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert({
        id: 1,
        campaign_id: 1,
        description: "Original cost",
        cost: 100.0,
        type_id: 1,
        supplier_id: 1,
      });

      await tryber.tables.WpAppqCampaignOtherCostsAttachment.do().insert([
        {
          id: 1,
          cost_id: 1,
          url: "https://s3.eu-west-1.amazonaws.com/bucket/file1.pdf",
          mime_type: "application/pdf",
        },
        {
          id: 2,
          cost_id: 1,
          url: "https://s3.eu-west-1.amazonaws.com/bucket/file2.jpg",
          mime_type: "image/jpeg",
        },
        {
          id: 3,
          cost_id: 1,
          url: "https://s3.eu-west-1.amazonaws.com/bucket/file3.png",
          mime_type: "image/png",
        },
      ]);

      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(200);
      expect(deleteFromS3).toHaveBeenCalledTimes(3);
      expect(deleteFromS3).toHaveBeenCalledWith({
        url: "https://s3.eu-west-1.amazonaws.com/bucket/file1.pdf",
      });
      expect(deleteFromS3).toHaveBeenCalledWith({
        url: "https://s3.eu-west-1.amazonaws.com/bucket/file2.jpg",
      });
      expect(deleteFromS3).toHaveBeenCalledWith({
        url: "https://s3.eu-west-1.amazonaws.com/bucket/file3.png",
      });
    });

    it("Should update cost without old attachments", async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert({
        id: 1,
        campaign_id: 1,
        description: "Original cost",
        cost: 100.0,
        type_id: 1,
        supplier_id: 1,
      });

      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(200);

      const attachments =
        await tryber.tables.WpAppqCampaignOtherCostsAttachment.do()
          .where({ cost_id: 1 })
          .select();
      expect(attachments).toHaveLength(2);
      expect(deleteFromS3).not.toHaveBeenCalled();
    });

    it("Should update cost with empty attachments array", async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert({
        id: 1,
        campaign_id: 1,
        description: "Original cost",
        cost: 100.0,
        type_id: 1,
        supplier_id: 1,
      });

      await tryber.tables.WpAppqCampaignOtherCostsAttachment.do().insert({
        id: 1,
        cost_id: 1,
        url: "https://s3.eu-west-1.amazonaws.com/bucket/old-file.pdf",
        mime_type: "application/pdf",
      });

      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send({ ...validPayload, attachments: [] })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(200);

      const attachments =
        await tryber.tables.WpAppqCampaignOtherCostsAttachment.do()
          .where({ cost_id: 1 })
          .select();
      expect(attachments).toHaveLength(0);
      expect(deleteFromS3).toHaveBeenCalledTimes(1);
    });

    it("Should only update specified cost, not others", async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert([
        {
          id: 1,
          campaign_id: 1,
          description: "Cost to update",
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
        .patch("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(200);

      const updatedCost = await tryber.tables.WpAppqCampaignOtherCosts.do()
        .where({ id: 1 })
        .first();
      expect(updatedCost).toEqual(
        expect.objectContaining({
          description: "Riparazione hardware ufficio",
          cost: 250.5,
        })
      );

      const untouchedCost = await tryber.tables.WpAppqCampaignOtherCosts.do()
        .where({ id: 2 })
        .first();
      expect(untouchedCost).toEqual(
        expect.objectContaining({
          description: "Cost to keep",
          cost: 200.0,
        })
      );

      const getResponse = await request(app)
        .get("/campaigns/1/finance/otherCosts")
        .set("Authorization", "Bearer admin");
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items).toHaveLength(2);
    });
  });

  describe("Success - olp permissions", () => {
    it("Should update cost with olp permissions", async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert({
        id: 1,
        campaign_id: 1,
        description: "Original cost",
        cost: 100.0,
        type_id: 1,
        supplier_id: 1,
      });

      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
      expect(response.status).toBe(200);

      const updatedCost = await tryber.tables.WpAppqCampaignOtherCosts.do()
        .where({ id: 1 })
        .first();
      expect(updatedCost).toEqual(
        expect.objectContaining({
          description: "Riparazione hardware ufficio",
          cost: 250.5,
        })
      );
    });

    it("Should update cost and replace attachments with olp permissions", async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert({
        id: 1,
        campaign_id: 1,
        description: "Original cost",
        cost: 100.0,
        type_id: 1,
        supplier_id: 1,
      });

      await tryber.tables.WpAppqCampaignOtherCostsAttachment.do().insert([
        {
          id: 1,
          cost_id: 1,
          url: "https://old.com/old1.pdf",
          mime_type: "application/pdf",
        },
        {
          id: 2,
          cost_id: 1,
          url: "https://old.com/old2.jpg",
          mime_type: "image/jpeg",
        },
      ]);

      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
      expect(response.status).toBe(200);

      const attachments =
        await tryber.tables.WpAppqCampaignOtherCostsAttachment.do()
          .where({ cost_id: 1 })
          .select();
      expect(attachments).toHaveLength(2);
      expect(deleteFromS3).toHaveBeenCalledTimes(2);

      const getResponse = await request(app)
        .get("/campaigns/1/finance/otherCosts")
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items).toHaveLength(1);
      expect(getResponse.body.items[0]).toEqual(
        expect.objectContaining({
          cost_id: 1,
          description: "Riparazione hardware ufficio",
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("Should return 500 if S3 deletion fails", async () => {
      await tryber.tables.WpAppqCampaignOtherCosts.do().insert({
        id: 1,
        campaign_id: 1,
        description: "Original cost",
        cost: 100.0,
        type_id: 1,
        supplier_id: 1,
      });

      await tryber.tables.WpAppqCampaignOtherCostsAttachment.do().insert({
        id: 1,
        cost_id: 1,
        url: "https://s3.eu-west-1.amazonaws.com/bucket/file.pdf",
        mime_type: "application/pdf",
      });

      (deleteFromS3 as jest.Mock).mockRejectedValueOnce(
        new Error("S3 deletion failed")
      );

      const response = await request(app)
        .patch("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(500);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: "Error updating other cost",
        })
      );
    });
  });
});
