import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const config = {
  modules: [
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
  ],
  project_id: 12345,
};

const notQuotedTemplate = {
  id: 66,
  name: "Test Template",
  description: "Test Description",
  config: JSON.stringify(config),
};
const quotedTemplate = {
  ...notQuotedTemplate,
  id: 67,
  price: 1900.69,
};

const plan = {
  id: 19,
  name: "Test Plan",
  description: "Test Description",
  config: JSON.stringify(config),
  created_by: 1,
  template_id: notQuotedTemplate.id,
};

const baseRequest = {
  quote: "1900.69",
  applicant_id: 1,
};

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
  customer_id: 1,
};

describe("Route POST /dossiers/:campaignId/quotations", () => {
  beforeAll(async () => {
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
        ...plan,
      },
      {
        ...plan,
        id: 20,
      },
      {
        ...plan,
        id: 22,
        template_id: quotedTemplate.id,
      },
    ]);
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 80, plan_id: plan.id }, // plan from Not quoted template
      { ...campaign, id: 81, plan_id: 20 }, // Not exist plan
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
  it("Should answer 201 if user is admin", async () => {
    const response = await request(app)
      .post("/dossiers/80/quotations")
      .set("authorization", "Bearer admin")
      .send(baseRequest);
    expect(response.status).toBe(201);
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

  it("Should return the quotation id", async () => {
    const response = await request(app)
      .post("/dossiers/80/quotations")
      .set("authorization", "Bearer admin")
      .send(baseRequest);
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: expect.any(Number) });
  });
  it("Should add a new quotation if data are valid", async () => {
    const quotationBefore = await tryber.tables.CpReqQuotations.do().select();
    const response = await request(app)
      .post("/dossiers/80/quotations")
      .set("authorization", "Bearer admin")
      .send(baseRequest);
    expect(response.status).toBe(201);
    const quotationAfter = await tryber.tables.CpReqQuotations.do().select();
    expect(quotationAfter.length).toBe(quotationBefore.length + 1);
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

  it("Should insert correct quote", async () => {
    const response = await request(app)
      .post("/dossiers/80/quotations")
      .set("authorization", "Bearer admin")
      .send(baseRequest);
    expect(response.status).toBe(201);
    const quote = await tryber.tables.CpReqQuotations.do()
      .select()
      .where({ id: response.body.id })
      .first();
    expect(quote).toEqual(
      expect.objectContaining({ estimated_cost: baseRequest.quote })
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

  describe("status evaluation", () => {
    it("Should insert the quote in status = pending if plan is based on not quoted template", async () => {
      const response = await request(app)
        .post("/dossiers/80/quotations")
        .set("authorization", "Bearer admin")
        .send(baseRequest);
      expect(response.status).toBe(201);
      const quote = await tryber.tables.CpReqQuotations.do()
        .select()
        .where({ id: response.body.id })
        .first();
      expect(quote).toEqual(expect.objectContaining({ status: "proposed" }));
    });

    it("Should insert the quote in status = proposed if plan is based on quoted template", async () => {
      const response = await request(app)
        .post("/dossiers/90/quotations")
        .set("authorization", "Bearer admin")
        .send(baseRequest);
      expect(response.status).toBe(201);
      const quote = await tryber.tables.CpReqQuotations.do()
        .select()
        .where({ id: response.body.id })
        .first();
      expect(quote).toEqual(expect.objectContaining({ status: "pending" }));
    });
  });
});
