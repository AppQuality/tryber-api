import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

describe("POST /campaigns/campaignId/finance/otherCosts", () => {
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

  describe("Not enough permissions", () => {
    it("Should return 403 if logged out", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send(validPayload);
      expect(response.status).toBe(403);
    });

    it("Should return 403 if logged in as not admin user", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(403);
    });

    it("Should return 403 if no access to the campaign", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[2]}');
      expect(response.status).toBe(403);
    });
  });

  describe("Validation errors", () => {
    it("Should return 400 if description is empty", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send({ ...validPayload, description: "" })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: "Description should not be empty",
        })
      );
    });

    it("Should return 400 if description is only whitespace", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send({ ...validPayload, description: "   " })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: "Description should not be empty",
        })
      );
    });

    it("Should return 400 if cost is 0", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send({ ...validPayload, cost: 0 })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: "Cost must be greater than 0",
        })
      );
    });

    it("Should return 400 if cost is negative", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send({ ...validPayload, cost: -10 })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: "Cost must be greater than 0",
        })
      );
    });

    it("Should return 400 if type_id does not exist", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send({ ...validPayload, type_id: 999 })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: "Type not found",
        })
      );
    });

    it("Should return 400 if supplier_id does not exist", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send({ ...validPayload, supplier_id: 999 })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: "Supplier not found",
        })
      );
    });

    it("Should return 400 if attachments array is empty", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send({ ...validPayload, attachments: [] })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: "At least one attachment is required",
        })
      );
    });

    it("Should return 400 if attachment url is empty", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send({
          ...validPayload,
          attachments: [
            {
              url: "",
              mime_type: "application/pdf",
            },
          ],
        })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: "Attachment URL is required",
        })
      );
    });

    it("Should return 400 if attachment mime_type is empty", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send({
          ...validPayload,
          attachments: [
            {
              url: "https://esempio.com/documenti/fattura.pdf",
              mime_type: "",
            },
          ],
        })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: "Attachment mime_type is required",
        })
      );
    });
  });

  describe("Success - admin permissions", () => {
    it("Should return 201 if logged in as admin", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(201);
    });

    it("Should create other cost in database", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(201);

      const getResponse = await request(app)
        .get("/campaigns/1/finance/otherCosts")
        .set("Authorization", "Bearer admin");
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items).toHaveLength(1);
      expect(getResponse.body.items[0]).toEqual(
        expect.objectContaining({
          description: "Riparazione hardware ufficio",
          type: { name: "Type 3", id: 3 },
          supplier: { name: "Supplier 105", id: 105 },
        })
      );
    });

    it("Should create attachments in database", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(201);

      const getResponse = await request(app)
        .get("/campaigns/1/finance/otherCosts")
        .set("Authorization", "Bearer admin");
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items[0].attachments).toHaveLength(2);
      expect(getResponse.body.items[0].attachments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            url: "https://esempio.com/documenti/fattura.pdf",
            mimetype: "application/pdf",
          }),
          expect.objectContaining({
            url: "https://esempio.com/immagini/danno.jpg",
            mimetype: "image/jpeg",
          }),
        ])
      );
    });

    it("Should create cost with single attachment", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send({
          ...validPayload,
          attachments: [
            {
              url: "https://esempio.com/documenti/fattura.pdf",
              mime_type: "application/pdf",
            },
          ],
        })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(201);

      const getResponse = await request(app)
        .get("/campaigns/1/finance/otherCosts")
        .set("Authorization", "Bearer admin");
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items[0].attachments).toHaveLength(1);
    });

    it("Should create cost with multiple attachments", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send({
          ...validPayload,
          attachments: [
            {
              url: "https://esempio.com/documenti/fattura1.pdf",
              mime_type: "application/pdf",
            },
            {
              url: "https://esempio.com/documenti/fattura2.pdf",
              mime_type: "application/pdf",
            },
            {
              url: "https://esempio.com/immagini/danno.jpg",
              mime_type: "image/jpeg",
            },
          ],
        })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(201);

      const getResponse = await request(app)
        .get("/campaigns/1/finance/otherCosts")
        .set("Authorization", "Bearer admin");
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items[0].attachments).toHaveLength(3);
    });

    it("Should create multiple costs independently", async () => {
      const response1 = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", "Bearer admin");
      expect(response1.status).toBe(201);

      const response2 = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send({
          ...validPayload,
          description: "Second cost",
          cost: 100.0,
        })
        .set("Authorization", "Bearer admin");
      expect(response2.status).toBe(201);

      const getResponse = await request(app)
        .get("/campaigns/1/finance/otherCosts")
        .set("Authorization", "Bearer admin");
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items).toHaveLength(2);
    });

    it("Should accept decimal cost values", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send({ ...validPayload, cost: 123.456 })
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(201);

      const getResponse = await request(app)
        .get("/campaigns/1/finance/otherCosts")
        .set("Authorization", "Bearer admin");
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items[0]).toBeDefined();
    });
  });

  describe("Success - olp permissions", () => {
    it("Should return 201 if logged in as olp with access to campaign", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
      expect(response.status).toBe(201);
    });

    it("Should create other cost in database with olp permissions", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
      expect(response.status).toBe(201);

      const getResponse = await request(app)
        .get("/campaigns/1/finance/otherCosts")
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items).toHaveLength(1);
      expect(getResponse.body.items[0]).toEqual(
        expect.objectContaining({
          description: "Riparazione hardware ufficio",
        })
      );
    });

    it("Should create attachments with olp permissions", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
      expect(response.status).toBe(201);

      const getResponse = await request(app)
        .get("/campaigns/1/finance/otherCosts")
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items[0].attachments).toHaveLength(2);
    });

    it("Should return 403 if olp does not have access to campaign", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[2]}');
      expect(response.status).toBe(403);
    });
  });

  describe("Campaign isolation", () => {
    it("Should create cost only for specified campaign", async () => {
      const response = await request(app)
        .post("/campaigns/1/finance/otherCosts")
        .send(validPayload)
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(201);

      const getResponse1 = await request(app)
        .get("/campaigns/1/finance/otherCosts")
        .set("Authorization", "Bearer admin");
      expect(getResponse1.status).toBe(200);
      expect(getResponse1.body.items).toHaveLength(1);

      const getResponse2 = await request(app)
        .get("/campaigns/2/finance/otherCosts")
        .set("Authorization", "Bearer admin");
      expect(getResponse2.status).toBe(200);
      expect(getResponse2.body.items).toHaveLength(0);
    });
  });
});
