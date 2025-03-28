import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("Route GET /dossiers/:campaignId/quotesHistory", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqProject.do().insert({
      id: 12345,
      display_name: "project",
      customer_id: 54321,
      edited_by: 1,
    });
    await tryber.tables.WpAppqEvdProfile.do().insert({
      id: 1,
      wp_user_id: 1,
      email: "pino@example.com",
      employment_id: 1,
      education_id: 1,
    });
    await tryber.tables.CpReqTemplates.do().insert({
      id: 66,
      name: "Test Template",
      description: "Test Description",
      config: JSON.stringify({ modules: [] }),
    });
    await tryber.tables.WpAppqEvdCampaign.do().insert(
      {
        id: 80,
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
        customer_id: 54321,
      } // plan from Not quoted template
    );
    await tryber.seeds().campaign_statuses();
    await tryber.tables.CpReqPlans.do().insert([
      {
        id: 19,
        name: "Test Plan",
        description: "Test Description",
        config: JSON.stringify({ modules: [] }),
        created_by: 1,
        template_id: 66,
        project_id: 12345,
        status: "pending_review",
      },
      {
        id: 300,
        name: "Test Plan",
        description: "Test Description",
        config: JSON.stringify({ modules: [] }),
        created_by: 1,
        template_id: 66,
        project_id: 12345,
        status: "pending_review",
      },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.CpReqTemplates.do().delete();
    await tryber.tables.WpAppqProject.do().delete();
    await tryber.tables.CpReqPlans.do().delete();
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/dossiers/80/quotesHistory");

    expect(response.status).toBe(403);
  });

  it("Should answer 400 if campaign does not exists", async () => {
    const response = await request(app)
      .get(`/dossiers/999/quotesHistory`)
      .set("authorization", "Bearer admin");

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({ message: "Campaign not found" })
    );
  });

  it("Should answer 401 if not admin", async () => {
    const response = await request(app)
      .get("/dossiers/80/quotesHistory")
      .set("authorization", "Bearer tester");

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({ message: "No access to campaign" })
    );
  });

  describe("GET history dossier quotes", () => {
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
      customer_id: 54321,
    };

    const quotation = {
      created_by: 1,
      status: "proposed",
      status_changed_by: 1,
      estimated_cost: "1999",
      generated_from_plan: 19,
      config: JSON.stringify({ modules: [] }),
    };
    beforeEach(async () => {
      await tryber.tables.CpReqQuotations.do().insert([
        {
          ...quotation,
          id: 180,
          generated_from_plan: 19,
          status: "pending",
          estimated_cost: "10mln of apples",
        },
        {
          ...quotation,
          id: 190,
          generated_from_plan: 19,
          status: "rejected",
          estimated_cost: "12mln of bananas",
        },
        {
          ...quotation,
          id: 200,
          generated_from_plan: 19,
          status: "rejected",
          estimated_cost: "99M og passion fruits",
        },
        {
          ...quotation,
          id: 300,
          generated_from_plan: 300,
          status: "rejected",
          estimated_cost: "99M og passion fruits",
        },
      ]);
      await tryber.tables.WpAppqEvdCampaign.do().insert([
        {
          ...campaign,
          id: 180,
          title: "Test Campaign 180",
          plan_id: 19,
          phase_id: 1, // Draft
          quote_id: 180,
        },
        {
          ...campaign,
          id: 190,
          title: "Test Campaign 190",
          phase_id: 50, // Closing
          quote_id: 190,
        },
        {
          ...campaign,
          id: 200,
          title: "Test Campaign 200",
          phase_id: 50, // Closing
          quote_id: 200,
        },
        {
          ...campaign,
          id: 300,
          title: "Test Campaign 300",
          phase_id: 50, // Closing
          quote_id: 300,
        },
      ]);
    });
    afterEach(async () => {
      await tryber.tables.WpAppqEvdCampaign.do().delete();
      await tryber.tables.CpReqQuotations.do().delete();
    });
    it("Should answer 200", async () => {
      const response = await request(app)
        .get(`/dossiers/180/quotesHistory`)
        .set("authorization", "Bearer admin");

      expect(response.status).toBe(200);
    });
    it("Should return array of items", async () => {
      const response = await request(app)
        .get(`/dossiers/180/quotesHistory`)
        .set("authorization", "Bearer admin");

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty("items");
      expect(response.body.items).toBeInstanceOf(Array);
      expect(response.body.items.length).toBe(3);
    });
    it("Should return items with campaignData", async () => {
      const response = await request(app)
        .get(`/dossiers/180/quotesHistory`)
        .set("authorization", "Bearer admin");

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty(
        "items",
        expect.arrayContaining([
          expect.objectContaining({
            campaign: expect.objectContaining({
              id: 190,
              title: "Test Campaign 190",
              phase_id: 50,
              phase_name: "Closing",
            }),
          }),
          expect.objectContaining({
            campaign: expect.objectContaining({
              id: 200,
              title: "Test Campaign 200",
              phase_id: 50,
              phase_name: "Closing",
            }),
          }),
        ])
      );
    });
    it("Should return items with quoteData", async () => {
      const response = await request(app)
        .get(`/dossiers/180/quotesHistory`)
        .set("authorization", "Bearer admin");

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty(
        "items",
        expect.arrayContaining([
          expect.objectContaining({
            quote: expect.objectContaining({
              id: 190,
              amount: "12mln of bananas",
              status: "rejected",
            }),
          }),
          expect.objectContaining({
            quote: expect.objectContaining({
              id: 200,
              amount: "99M og passion fruits",
              status: "rejected",
            }),
          }),
        ])
      );
    });
  });
});
