import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

describe("GET /campaigns/campaignId/finance/otherCosts", () => {
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
    await tryber.tables.WpAppqCampaignOtherCosts.do().insert([
      {
        id: 1,
        campaign_id: 1,
        description: "Cost 1 description",
        cost: 100.5,
        type_id: 1,
        supplier_id: 1,
      },
      {
        id: 2,
        campaign_id: 1,
        description: "Cost 2 description",
        cost: 200.75,
        type_id: 2,
        supplier_id: 2,
      },
      {
        id: 3,
        campaign_id: 2,
        description: "Cost for other campaign",
        cost: 150.0,
        type_id: 1,
        supplier_id: 1,
      },
    ]);
    await tryber.tables.WpAppqCampaignOtherCostsAttachment.do().insert([
      {
        id: 1,
        url: "https://example.com/attachment1.pdf",
        mime_type: "application/pdf",
        cost_id: 1,
      },
      {
        id: 2,
        url: "https://example.com/attachment2.jpg",
        mime_type: "image/jpeg",
        cost_id: 1,
      },
      {
        id: 3,
        url: "https://example.com/attachment3.png",
        mime_type: "image/png",
        cost_id: 2,
      },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.WpAppqCampaignOtherCostsAttachment.do().delete();
    await tryber.tables.WpAppqCampaignOtherCosts.do().delete();
    await tryber.tables.WpAppqCampaignOtherCostsSupplier.do().delete();
    await tryber.tables.WpAppqCampaignOtherCostsType.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpUsers.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
  });

  it("Should return 403 if logged out", async () => {
    const response = await request(app).get("/campaigns/1/finance/otherCosts");
    expect(response.status).toBe(403);
  });

  it("Should return 403 if logged in as not admin user", async () => {
    const response = await request(app)
      .get("/campaigns/1/finance/otherCosts")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 403 if no access to the campaign", async () => {
    const response = await request(app)
      .get("/campaigns/1/finance/otherCosts")
      .set("Authorization", 'Bearer tester"');
    expect(response.status).toBe(403);
  });

  it("Should return 200 if logged in as admin", async () => {
    const response = await request(app)
      .get("/campaigns/1/finance/otherCosts")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should return finance other costs - admin", async () => {
    const response = await request(app)
      .get("/campaigns/1/finance/otherCosts")
      .set("Authorization", "Bearer admin");
    expect(response.body).toEqual(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({
            cost_id: 1,
            type: {
              name: "Type 1",
              id: 1,
            },
            supplier: {
              name: "Supplier 1",
              id: 1,
            },
            description: "Cost 1 description",
            attachments: expect.arrayContaining([
              expect.objectContaining({
                id: 1,
                url: "https://example.com/attachment1.pdf",
                mimetype: "application/pdf",
              }),
              expect.objectContaining({
                id: 2,
                url: "https://example.com/attachment2.jpg",
                mimetype: "image/jpeg",
              }),
            ]),
          }),
          expect.objectContaining({
            cost_id: 2,
            type: {
              name: "Type 2",
              id: 2,
            },
            supplier: {
              name: "Supplier 2",
              id: 2,
            },
            description: "Cost 2 description",
            attachments: expect.arrayContaining([
              expect.objectContaining({
                id: 3,
                url: "https://example.com/attachment3.png",
                mimetype: "image/png",
              }),
            ]),
          }),
        ]),
      })
    );
    expect(response.body.items).toHaveLength(2);
  });

  it("Should return other costs - olp permissions", async () => {
    const response = await request(app)
      .get("/campaigns/1/finance/otherCosts")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({
            cost_id: 1,
            type: {
              name: "Type 1",
              id: 1,
            },
            supplier: {
              name: "Supplier 1",
              id: 1,
            },
            description: "Cost 1 description",
          }),
          expect.objectContaining({
            cost_id: 2,
            type: {
              name: "Type 2",
              id: 2,
            },
            supplier: {
              name: "Supplier 2",
              id: 2,
            },
            description: "Cost 2 description",
          }),
        ]),
      })
    );
    expect(response.body.items).toHaveLength(2);
  });

  it("Should return empty items array if no costs exist for campaign", async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 99,
      platform_id: 1,
      start_date: "2020-01-01",
      end_date: "2020-01-01",
      title: "Campaign with no costs",
      page_preview_id: 1,
      page_manual_id: 1,
      customer_id: 1,
      pm_id: 1,
      project_id: 1,
      customer_title: "",
    });

    const response = await request(app)
      .get("/campaigns/99/finance/otherCosts")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [],
    });
  });

  it("Should not include costs from other campaigns", async () => {
    const response = await request(app)
      .get("/campaigns/1/finance/otherCosts")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(
      response.body.items.find((item: any) => item.cost_id === 3)
    ).toBeUndefined();
  });

  it("Should return cost with empty attachments array if cost has no attachments", async () => {
    await tryber.tables.WpAppqCampaignOtherCosts.do().insert({
      id: 10,
      campaign_id: 1,
      description: "Cost without attachments",
      cost: 50.0,
      type_id: 1,
      supplier_id: 1,
    });

    const response = await request(app)
      .get("/campaigns/1/finance/otherCosts")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);

    const costWithoutAttachments = response.body.items.find(
      (item: any) => item.cost_id === 10
    );
    expect(costWithoutAttachments).toBeDefined();
    expect(costWithoutAttachments.attachments).toEqual([]);
  });
});
