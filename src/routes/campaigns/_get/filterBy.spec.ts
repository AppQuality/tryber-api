import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
const campaign = {
  id: 1,
  platform_id: 1,
  start_date: new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  end_date: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  title: "This is the title",
  page_preview_id: 1,
  page_manual_id: 1,
  customer_id: 1,
  pm_id: 1,
  project_id: 1,
  customer_title: "",
  campaign_pts: 200,
};
const requiredModules = [
  {
    type: "title" as const,
    variant: "primary",
    output: "Project Kickoff",
  },
  {
    type: "dates" as const,
    variant: "default",
    output: {
      start: "2025-01-01",
    },
  },
  {
    type: "tasks" as const,
    variant: "default",
    output: [
      {
        kind: "bug" as const,
        title: "Task bug",
      },
    ],
  },
];
const quotedTemplateId = 90;
const unquotedTemplateId = 91;
describe("GET /campaigns", () => {
  beforeAll(async () => {
    await tryber.tables.CampaignPhase.do().insert([
      { id: 1, name: "Draft", type_id: 1 },
    ]);
    await tryber.tables.WpAppqCampaignType.do().insert([
      {
        id: 1,
        name: "Campaign Type 1",
        category_id: 1,
      },
      {
        id: 2,
        name: "Campaign Type 2",
        category_id: 1,
      },
      {
        id: 3,
        name: "Campaign Type 3",
        category_id: 1,
      },
    ]);
    await tryber.tables.WpAppqProject.do().insert([
      {
        id: 1,
        display_name: "Project 1",
        customer_id: 1,
        edited_by: 1,
      },
      {
        id: 2,
        display_name: "Project 2",
        customer_id: 2,
        edited_by: 1,
      },
      {
        id: 3,
        display_name: "Project 3",
        customer_id: 3,
        edited_by: 1,
      },
    ]);
    await tryber.tables.CpReqTemplates.do().insert([
      {
        id: quotedTemplateId,
        name: "Template Name",
        config: JSON.stringify({
          modules: requiredModules,
        }),
        price: "1000",
      },
      {
        id: unquotedTemplateId,
        name: "Template Name",
        config: JSON.stringify({
          modules: requiredModules,
        }),
      },
    ]);
    await tryber.tables.CpReqPlans.do().insert([
      {
        id: 15,
        name: "Plan Name",
        config: JSON.stringify({
          modules: requiredModules,
        }),
        project_id: campaign.project_id,
        template_id: quotedTemplateId,
      },
      {
        id: 16,
        name: "Plan Name",
        config: JSON.stringify({
          modules: requiredModules,
        }),
        project_id: 2,
        template_id: unquotedTemplateId,
      },
    ]);
    await tryber.tables.CpReqQuotations.do().insert([
      {
        id: 50,
        generated_from_plan: 15,
        estimated_cost: "2 kilotons",
        status: "confirmed",
        config: JSON.stringify({
          modules: requiredModules,
        }),
      },
      {
        id: 55,
        generated_from_plan: 16,
        estimated_cost: "3000 electronvolts",
        status: "proposed",
        config: JSON.stringify({
          modules: requiredModules,
        }),
      },
    ]);
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        id: 1,
        name: "name",
        surname: "surname",
        email: "",
        wp_user_id: 1,
        education_id: 1,
        employment_id: 1,
      },
    ]);

    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        ...campaign,
        id: 1,
        title: "First campaign",
        status_id: 1,
        campaign_type_id: 1,
        project_id: 1,
        plan_id: 15,
        quote_id: 50,
      },
      {
        ...campaign,
        id: 2,
        title: "Second campaign",
        project_id: 3,
        start_date: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        status_id: 1,
        campaign_type_id: 2,
      },
      {
        ...campaign,
        id: 3,
        title: "Third campaign",
        project_id: 2,
        status_id: 2,
        campaign_type_id: 3,
        plan_id: 16,
        quote_id: 55,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.CampaignPhase.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
  });

  it("Should return only campaigns of specific customers if filterBy is set", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[customer]=1,2")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, name: "First campaign" }),
        expect.objectContaining({ id: 3, name: "Third campaign" }),
      ])
    );
  });

  it("Should return total based on filter customer", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[customer]=1,2&limit=10")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.total).toBe(2);
  });

  it("Should return only campaigns closed if filterBy is set", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[status]=closed")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 3, name: "Third campaign" }),
      ])
    );
  });
  it("Should return total based on filter status closed", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[status]=closed&limit=10")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.total).toBe(1);
  });

  it("Should return only campaigns running if filterBy is set", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[status]=running")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, name: "First campaign" }),
      ])
    );
  });
  it("Should return total based on filter status running", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[status]=running&limit=10")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.total).toBe(1);
  });

  it("Should return only campaigns incoming if filterBy is set", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[status]=incoming")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 2, name: "Second campaign" }),
      ])
    );
  });
  it("Should return total based on filter status incoming", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[status]=incoming&limit=10")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.total).toBe(1);
  });
  it("Should return only campaigns of specific type if filterBy is set", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[type]=1,3")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, name: "First campaign" }),
        expect.objectContaining({ id: 3, name: "Third campaign" }),
      ])
    );
  });

  it("Should return only campaigns having a quotation if filterBy is set", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[hasQuote]")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
  });

  it("Should return total based on filter", async () => {
    const response = await request(app)
      .get("/campaigns?filterBy[type]=1,3&limit=10")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.total).toBe(2);
  });
  describe("Filter campaigns for quotation-table on dossier", () => {
    it("Should return only campaigns having a quotation of a specific customer", async () => {
      const response = await request(app)
        .get(
          "/campaigns?fields=id,title,startDate,phase,quote&filterBy[customer]=1&filterBy[hasQuote]"
        )
        .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(1);
    });
  });
});
