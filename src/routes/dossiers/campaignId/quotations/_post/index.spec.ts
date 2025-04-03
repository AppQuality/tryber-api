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
};

const baseRequest = {
  quote: "1900.69",
  applicant_id: 1,
};
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

describe("Route POST /dossiers/:campaignId/quotations", () => {
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
        price: quotedTemplate.price,
      },
    ]);
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 80, plan_id: plan.id }, // plan from Not quoted template
      { ...campaign, id: 85, plan_id: undefined }, // plan_id is null
      { ...campaign, id: 90, plan_id: 22 }, // plan from Quoted template
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
      .post("/dossiers/80/quotations")
      .send(baseRequest);
    expect(response.status).toBe(403);
  });

  it("Should answer 404 if campaign does not exists", async () => {
    const response = await request(app)
      .post("/dossiers/89/quotations")
      .set("authorization", "Bearer admin")
      .send(baseRequest);

    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({ message: "Campaign does not exist" })
    );
  });

  it("Should answer 401 if not admin", async () => {
    const response = await request(app)
      .post("/dossiers/80/quotations")
      .set("authorization", "Bearer tester")
      .send(baseRequest);
    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({ message: "No access to campaign" })
    );
  });

  it("Should answer 404 if plan does not exists", async () => {
    const response = await request(app)
      .post("/dossiers/85/quotations")
      .set("authorization", "Bearer admin")
      .send(baseRequest);
    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({ message: "Plan does not exist" })
    );
  });

  describe("Quote creation", () => {
    it("Should return the quotation id", async () => {
      const response = await request(app)
        .post("/dossiers/80/quotations")
        .set("authorization", "Bearer admin")
        .send(baseRequest);
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ id: expect.any(Number) });
    });

    it("Should answer 201 if user is admin", async () => {
      const response = await request(app)
        .post("/dossiers/80/quotations")
        .set("authorization", "Bearer admin")
        .send(baseRequest);
      expect(response.status).toBe(201);
    });
    it("Should insert correct quote", async () => {
      const response = await request(app)
        .post("/dossiers/80/quotations")
        .set("authorization", "Bearer admin")
        .send(baseRequest);
      expect(response.status).toBe(201);
      const newData = await request(app)
        .get(`/campaigns/?fields=quote&filterBy[hasQuote]`)
        .set("authorization", "Bearer admin");
      expect(newData.body).toEqual(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              quote: expect.objectContaining({
                id: response.body.id,
                status: "proposed",
                price: baseRequest.quote,
              }),
            }),
          ]),
        })
      );
    });
    it("Should return correct quote id", async () => {
      const quotationBefore = await tryber.tables.CpReqQuotations.do().select();
      const response = await request(app)
        .post("/dossiers/80/quotations")
        .set("authorization", "Bearer admin")
        .send(baseRequest);
      expect(response.status).toBe(201);
      const quotationAfter = await tryber.tables.CpReqQuotations.do().select();
      expect(quotationBefore).toEqual(
        expect.not.arrayContaining([
          expect.objectContaining({ id: response.body.id }),
        ])
      );
      expect(quotationAfter).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: response.body.id }),
        ])
      );
    });

    it("Should insert the applicant id", async () => {
      const response = await request(app)
        .post("/dossiers/80/quotations")
        .set("authorization", "Bearer admin")
        .send(baseRequest);
      expect(response.status).toBe(201);
      const quote = await tryber.tables.CpReqQuotations.do()
        .select()
        .where({ id: response.body.id })
        .first();
      expect(quote).toEqual(expect.objectContaining({ created_by: 1 }));
    });

    it("Should insert the the note if send it", async () => {
      const response = await request(app)
        .post("/dossiers/80/quotations")
        .set("authorization", "Bearer admin")
        .send({ ...baseRequest, notes: "Test note" });
      expect(response.status).toBe(201);
      const quote = await tryber.tables.CpReqQuotations.do()
        .select()
        .where({ id: response.body.id })
        .first();
      expect(quote).toEqual(expect.objectContaining({ notes: "Test note" }));
    });
  });
  describe("Case: plan from unquoted template", () => {
    it("Should return an error if send empty object", async () => {
      const response = await request(app)
        .post("/dossiers/80/quotations")
        .set("authorization", "Bearer admin")
        .send({});
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({ message: "Quote required" })
      );
    });

    it("Should not create quotation if send empty object", async () => {
      const quotationBefore = await tryber.tables.CpReqQuotations.do().select();
      const response = await request(app)
        .post("/dossiers/80/quotations")
        .set("authorization", "Bearer admin")
        .send({});
      expect(response.status).toBe(400);
      const quotationAfter = await tryber.tables.CpReqQuotations.do().select();
      expect(quotationAfter.length).toBe(quotationBefore.length);
    });

    it("Should create quotation with notes if send notes", async () => {
      const response = await request(app)
        .post("/dossiers/80/quotations")
        .set("authorization", "Bearer admin")
        .send({ quote: "1200 stars", notes: "quote notes" });
      expect(response.status).toBe(201);
      const quotation = await tryber.tables.CpReqQuotations.do()
        .select()
        .where({ id: response.body.id })
        .first();
      expect(quotation).toEqual(
        expect.objectContaining({ notes: "quote notes" })
      );
    });

    it("Should create quotation with correct price if send a quote", async () => {
      const response = await request(app)
        .post("/dossiers/80/quotations")
        .set("authorization", "Bearer admin")
        .send({ quote: "2999 oranges" });
      expect(response.status).toBe(201);
      const quotation = await tryber.tables.CpReqQuotations.do()
        .select()
        .where({ id: response.body.id })
        .first();
      expect(quotation).toEqual(
        expect.objectContaining({ estimated_cost: "2999 oranges" })
      );
    });
    it("Should create quotation with status proposed if send a quote", async () => {
      const response = await request(app)
        .post("/dossiers/80/quotations")
        .set("authorization", "Bearer admin")
        .send({ quote: quotedTemplate.price });
      expect(response.status).toBe(201);
      const quotation = await tryber.tables.CpReqQuotations.do()
        .select()
        .where({ id: response.body.id })
        .first();
      expect(quotation).toEqual(
        expect.objectContaining({ status: "proposed" })
      );
    });
  });

  describe("Case: plan from quoted template", () => {
    it("Should return 201 if send empty object", async () => {
      const response = await request(app)
        .post("/dossiers/90/quotations")
        .set("authorization", "Bearer admin")
        .send({});
      expect(response.status).toBe(201);
    });

    it("Should create quotation if send empty object", async () => {
      const quotationBefore = await tryber.tables.CpReqQuotations.do().select();
      const response = await request(app)
        .post("/dossiers/90/quotations")
        .set("authorization", "Bearer admin")
        .send({});
      expect(response.status).toBe(201);
      const quotationAfter = await tryber.tables.CpReqQuotations.do().select();
      expect(quotationAfter.length).toBe(quotationBefore.length + 1);
    });
    it("Should create quotation with price from template if send empty object", async () => {
      const response = await request(app)
        .post("/dossiers/90/quotations")
        .set("authorization", "Bearer admin")
        .send({});
      expect(response.status).toBe(201);
      const quotation = await tryber.tables.CpReqQuotations.do()
        .select()
        .where({ id: response.body.id })
        .first();
      expect(quotation).toEqual(
        expect.objectContaining({ estimated_cost: quotedTemplate.price })
      );
    });
    it("Should create quotation with status pending if send empty object", async () => {
      const response = await request(app)
        .post("/dossiers/90/quotations")
        .set("authorization", "Bearer admin")
        .send({});
      expect(response.status).toBe(201);
      const quotation = await tryber.tables.CpReqQuotations.do()
        .select()
        .where({ id: response.body.id })
        .first();
      expect(quotation).toEqual(expect.objectContaining({ status: "pending" }));
    });
    it("Should create quotation with notes if send notes", async () => {
      const response = await request(app)
        .post("/dossiers/90/quotations")
        .set("authorization", "Bearer admin")
        .send({ notes: "quote notes" });
      expect(response.status).toBe(201);
      const quotation = await tryber.tables.CpReqQuotations.do()
        .select()
        .where({ id: response.body.id })
        .first();
      expect(quotation).toEqual(
        expect.objectContaining({ notes: "quote notes" })
      );
    });
    it("Should create quotation with status proposed if send a different quote", async () => {
      const response = await request(app)
        .post("/dossiers/90/quotations")
        .set("authorization", "Bearer admin")
        .send({ quote: "2999 oranges" });
      expect(response.status).toBe(201);
      const quotation = await tryber.tables.CpReqQuotations.do()
        .select()
        .where({ id: response.body.id })
        .first();
      expect(quotation).toEqual(
        expect.objectContaining({ status: "proposed" })
      );
    });
    it("Should create quotation with correct price if send a different quote", async () => {
      const response = await request(app)
        .post("/dossiers/90/quotations")
        .set("authorization", "Bearer admin")
        .send({ quote: "2999 oranges" });
      expect(response.status).toBe(201);
      const quotation = await tryber.tables.CpReqQuotations.do()
        .select()
        .where({ id: response.body.id })
        .first();
      expect(quotation).toEqual(
        expect.objectContaining({ estimated_cost: "2999 oranges" })
      );
    });
    it("Should create quotation with status pending if send a same quote", async () => {
      const response = await request(app)
        .post("/dossiers/90/quotations")
        .set("authorization", "Bearer admin")
        .send({ quote: quotedTemplate.price });
      expect(response.status).toBe(201);
      const quotation = await tryber.tables.CpReqQuotations.do()
        .select()
        .where({ id: response.body.id })
        .first();
      expect(quotation).toEqual(expect.objectContaining({ status: "pending" }));
    });
  });

  describe("Case: quotation already exist", () => {
    it("Should return an error if the quotation already exist", async () => {
      await request(app)
        .post("/dossiers/80/quotations")
        .set("authorization", "Bearer admin")
        .send(baseRequest);

      const response2ndAttempt = await request(app)
        .post("/dossiers/80/quotations")
        .set("authorization", "Bearer admin")
        .send(baseRequest);
      expect(response2ndAttempt.status).toBe(400);
      expect(response2ndAttempt.body).toEqual(
        expect.objectContaining({ message: "Plan already quoted" })
      );
    });
    it("Should not insert a quotaion if plan quotation not rejected already exist", async () => {
      await request(app)
        .post("/dossiers/80/quotations")
        .set("authorization", "Bearer admin")
        .send(baseRequest);

      const quotationsBefore2ndAttempt =
        await tryber.tables.CpReqQuotations.do().select();
      await request(app)
        .post("/dossiers/80/quotations")
        .set("authorization", "Bearer admin")
        .send(baseRequest);

      const quotationsAfter2ndAttempt =
        await tryber.tables.CpReqQuotations.do().select();

      expect(quotationsAfter2ndAttempt.length).toBe(
        quotationsBefore2ndAttempt.length
      );
    });

    it("Should insert a quotaion if plan quotation rejected already exist", async () => {
      await tryber.tables.CpReqQuotations.do().insert({
        created_by: 1,
        status: "rejected",
        estimated_cost: "1000",
        config: plan.config,
        generated_from_plan: plan.id,
      });
      const quotationsBefore2ndAttempt =
        await tryber.tables.CpReqQuotations.do().select();

      await request(app)
        .post("/dossiers/80/quotations")
        .set("authorization", "Bearer admin")
        .send(baseRequest);

      const quotationsAfter2ndAttempt =
        await tryber.tables.CpReqQuotations.do().select();

      expect(quotationsAfter2ndAttempt.length).toBe(
        quotationsBefore2ndAttempt.length + 1
      );
    });
  });
});
