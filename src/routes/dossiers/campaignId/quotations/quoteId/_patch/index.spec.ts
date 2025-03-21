import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const requiredModules = [
  {
    type: "title",
    output: "plan title",
    variant: "default",
  },
  {
    type: "dates",
    output: {
      start: "2025-03-12T23:00:00.000",
    },
    variant: "default",
  },
  {
    type: "tasks",
    variant: "default",
    output: [
      {
        kind: "video",
        title: "string",
      },
    ],
  },
];

const config = { modules: requiredModules };

const notQuotedTemplate = {
  id: 66,
  name: "Test Template",
  description: "Test Description",
  config: JSON.stringify(config),
};
const quotedTemplate = {
  ...notQuotedTemplate,
  id: 67,
  price: "1900.69",
};

const plan = {
  id: 19,
  name: "Test Plan",
  description: "Test Description",
  config: JSON.stringify(config),
  created_by: 1,
  template_id: notQuotedTemplate.id,
  project_id: 12345,
  status: "pending_review",
};

const baseRequest = {};
const customer_id = 54321;

const campaign = {
  project_id: 1,
  campaign_type_id: 1,
  title: "Test Campaign 80",
  customer_title: "Test Customer Campaign 80",
  start_date: "2019-08-24T14:15:22Z",
  end_date: "2019-08-24T14:15:22Z",
  platform_id: 1,
  page_manual_id: 1,
  page_preview_id: 1,
  pm_id: 1,
  customer_id,
};

const quotation = {
  id: 1,
  created_by: 1,
  status: "proposed",
  estimated_cost: "1999",
  plan_id: plan.id,
  config: plan.config,
};
const quotationapproved = {
  ...quotation,
  status: "approved",
  id: 12,
};
const quotationOtherCp = {
  ...quotation,
  id: 123,
  plan_id: 25,
};
const quotationPending = {
  ...quotation,
  id: 1234,
  status: "pending",
};
const quotationProposed = {
  ...quotation,
  id: 12345,
  status: "proposed",
};

describe("Route PATCH /dossiers/:campaignId/quotations/:quoteId", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqProject.do().insert({
      id: plan.project_id,
      display_name: "project",
      customer_id,
      edited_by: 1,
    });
    await tryber.tables.WpAppqEvdProfile.do().insert({
      id: 1,
      wp_user_id: 1,
      email: "pino@example.com",
      employment_id: 1,
      education_id: 1,
    });
    await tryber.tables.CpReqTemplates.do().insert([
      notQuotedTemplate,
      quotedTemplate,
    ]);
    await tryber.tables.CpReqPlans.do().insert([
      {
        ...plan, // plan from unquoted template
      },
      {
        ...plan, // plan from quoted template
        id: 22,
        template_id: quotedTemplate.id,
      },
      {
        ...plan, // plan of campaign 90
        id: 25,
        template_id: quotedTemplate.id,
      },
    ]);
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 80, plan_id: plan.id }, // plan from Not quoted template
      { ...campaign, id: 99, plan_id: 25 },
    ]);
  });

  beforeEach(async () => {
    await tryber.tables.CpReqQuotations.do().insert([
      quotation,
      quotationapproved,
      quotationOtherCp,
      quotationPending,
      quotationProposed,
    ]);
  });

  afterEach(async () => {
    await tryber.tables.CpReqQuotations.do().delete();
  });

  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.CpReqPlans.do().delete();
    await tryber.tables.CpReqTemplates.do().delete();
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app)
      .patch("/dossiers/80/quotations/1234")
      .send(baseRequest);
    expect(response.status).toBe(403);
  });

  it("Should answer 404 if campaign does not exists", async () => {
    const response = await request(app)
      .patch(`/dossiers/999/quotations/${quotation.id}`)
      .set("authorization", "Bearer admin")
      .send(baseRequest);

    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({ message: "Campaign does not exist" })
    );
  });

  it("Should answer 401 if not admin", async () => {
    const response = await request(app)
      .patch("/dossiers/80/quotations/1234")
      .set("authorization", "Bearer tester")
      .send(baseRequest);
    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({ message: "No access to campaign" })
    );
  });

  it("Should answer 404 if quote does not exists", async () => {
    const response = await request(app)
      .patch("/dossiers/80/quotations/9999999999")
      .set("authorization", "Bearer admin")
      .send(baseRequest);
    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({ message: "Quotation does not exist" })
    );
  });
  it("Should answer 404 if quote is approved", async () => {
    const response = await request(app)
      .patch(`/dossiers/80/quotations/${quotationapproved.id}`)
      .set("authorization", "Bearer admin")
      .send(baseRequest);
    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({ message: "Quotation does not exist" })
    );
  });
  it("Should answer 404 if quote is of another campaign", async () => {
    const response = await request(app)
      .patch(`/dossiers/80/quotations/${quotationOtherCp.id}`)
      .set("authorization", "Bearer admin")
      .send(baseRequest);
    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({ message: "Quotation does not exist" })
    );
  });

  describe("PATCH a pending quotation", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqEvdCampaign.do().insert([
        {
          ...campaign,
          id: 180,
          plan_id: plan.id,
          quote_id: quotationPending.id,
        }, // plan from Not quoted template
      ]);
    });
    afterEach(async () => {
      await tryber.tables.WpAppqEvdCampaign.do().delete();
    });
    it("Should answer 200", async () => {
      const response = await request(app)
        .patch(`/dossiers/180/quotations/${quotationPending.id}`)
        .set("authorization", "Bearer admin")
        .send(baseRequest);
      expect(response.status).toBe(200);
    });
    it("Should update status to approved if send empty body", async () => {
      const response = await request(app)
        .patch(`/dossiers/180/quotations/${quotationPending.id}`)
        .set("authorization", "Bearer admin")
        .send(baseRequest);
      expect(response.status).toBe(200);

      const newData = await request(app)
        .get(`/campaigns?fields=quote&filterBy[hasQuote]`)
        .set("authorization", "Bearer admin");
      expect(newData.status).toBe(200);
      expect(newData.body).toHaveProperty(
        "items",
        expect.arrayContaining([
          expect.objectContaining({
            quote: expect.objectContaining({
              id: quotationPending.id,
              status: "approved",
            }),
          }),
        ])
      );
    });
    it("Should update status to approved if send same amount of current quotation", async () => {
      const response = await request(app)
        .patch(`/dossiers/180/quotations/${quotationPending.id}`)
        .set("authorization", "Bearer admin")
        .send({ amount: quotationPending.estimated_cost });
      expect(response.status).toBe(200);

      const newData = await request(app)
        .get(`/campaigns?fields=quote&filterBy[hasQuote]`)
        .set("authorization", "Bearer admin");
      expect(newData.status).toBe(200);
      expect(newData.body).toHaveProperty(
        "items",
        expect.arrayContaining([
          expect.objectContaining({
            quote: expect.objectContaining({
              id: quotationPending.id,
              status: "approved",
            }),
          }),
        ])
      );
    });

    it("Should update status to proposed if send different amount of current quotation", async () => {
      const response = await request(app)
        .patch(`/dossiers/180/quotations/${quotationPending.id}`)
        .set("authorization", "Bearer admin")
        .send({ amount: "2000 oranges" });
      expect(response.status).toBe(200);

      const newData = await request(app)
        .get(`/campaigns?fields=quote&filterBy[hasQuote]`)
        .set("authorization", "Bearer admin");
      expect(newData.status).toBe(200);
      expect(newData.body).toHaveProperty(
        "items",
        expect.arrayContaining([
          expect.objectContaining({
            quote: expect.objectContaining({
              id: quotationPending.id,
              status: "proposed",
            }),
          }),
        ])
      );
    });
    it("Should update amount if send different amount of current quotation", async () => {
      const response = await request(app)
        .patch(`/dossiers/180/quotations/${quotationPending.id}`)
        .set("authorization", "Bearer admin")
        .send({ amount: "2000 oranges" });
      expect(response.status).toBe(200);

      const newData = await request(app)
        .get(`/campaigns?fields=quote&filterBy[hasQuote]`)
        .set("authorization", "Bearer admin");
      expect(newData.status).toBe(200);
      expect(newData.body).toHaveProperty(
        "items",
        expect.arrayContaining([
          expect.objectContaining({
            quote: expect.objectContaining({
              id: quotationPending.id,
              price: "2000 oranges",
            }),
          }),
        ])
      );
    });
  });
  describe("PATCH a proposed quotation", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqEvdCampaign.do().insert([
        {
          ...campaign,
          id: 200,
          plan_id: plan.id,
          quote_id: quotationProposed.id,
        }, // plan from Not quoted template
      ]);
    });
    afterEach(async () => {
      await tryber.tables.WpAppqEvdCampaign.do().delete();
    });
    it("Should answer 200", async () => {
      const response = await request(app)
        .patch(`/dossiers/200/quotations/${quotationProposed.id}`)
        .set("authorization", "Bearer admin")
        .send({ amount: "2000 oranges" });
      expect(response.status).toBe(200);
    });
    it("Should return an error if send empty body on a proposed quote", async () => {
      const response = await request(app)
        .patch(`/dossiers/200/quotations/${quotationProposed.id}`)
        .set("authorization", "Bearer admin")
        .send(baseRequest);
      expect(response.status).toBe(400);
    });

    it("Should not update status if send different amount of current quotation", async () => {
      const response = await request(app)
        .patch(`/dossiers/200/quotations/${quotationProposed.id}`)
        .set("authorization", "Bearer admin")
        .send({ amount: "2000 oranges" });
      expect(response.status).toBe(200);

      const newData = await request(app)
        .get(`/campaigns?fields=quote&filterBy[hasQuote]`)
        .set("authorization", "Bearer admin");
      expect(newData.status).toBe(200);

      expect(newData.body).toHaveProperty(
        "items",
        expect.arrayContaining([
          expect.objectContaining({
            quote: expect.objectContaining({
              id: quotationProposed.id,
              status: quotationProposed.status,
            }),
          }),
        ])
      );
    });
    it("Should update amount if send different amount of current quotation", async () => {
      const response = await request(app)
        .patch(`/dossiers/200/quotations/${quotationProposed.id}`)
        .set("authorization", "Bearer admin")
        .send({ amount: "2000 oranges" });
      expect(response.status).toBe(200);

      const newData = await request(app)
        .get(`/campaigns?fields=quote&filterBy[hasQuote]`)
        .set("authorization", "Bearer admin");
      expect(newData.status).toBe(200);

      expect(newData.body).toHaveProperty(
        "items",
        expect.arrayContaining([
          expect.objectContaining({
            quote: expect.objectContaining({
              id: quotationProposed.id,
              price: "2000 oranges",
            }),
          }),
        ])
      );
    });
  });
});
