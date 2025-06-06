import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
const campaign = {
  id: 1,
  platform_id: 1,
  start_date: "2023-01-13 10:10:10",
  end_date: "2023-01-14 10:10:10",
  title: "This is the title",
  page_preview_id: 1,
  page_manual_id: 1,
  customer_id: 1,
  pm_id: 1,
  project_id: 99,
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
    await tryber.tables.WpAppqCustomer.do().insert([
      {
        id: 1,
        company: "Company 1",
        pm_id: 1,
        email: "",
        phone_number: "",
      },
    ]);
    await tryber.tables.WpAppqProject.do().insert([
      {
        id: campaign.project_id,
        display_name: "Project 1",
        customer_id: 1,
        edited_by: 1,
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
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        id: 2,
        name: "test",
        surname: "test",
        email: "",
        wp_user_id: 2,
        education_id: 1,
        employment_id: 1,
      },
    ]);
    await tryber.tables.WpAppqCampaignType.do().insert([
      { id: 1, name: "CampaignType 1", type: 0, category_id: 1 }, // type 0 -> quality
      { id: 2, name: "CampaignType 2", type: 1, category_id: 1 }, // type 1 -> experience
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
        project_id: campaign.project_id,
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
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        ...campaign,
        id: 1,
        title: "First campaign",
        customer_title: "C First campaign",
        status_id: 1,
        campaign_type_id: 1,
        plan_id: 15, // plan from quoted template
        quote_id: 50,
      },
      {
        ...campaign,
        id: 2,
        title: "Second campaign",
        start_date: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        customer_title: "C Second campaign",
        status_id: 1,
      },
      {
        ...campaign,
        id: 3,
        pm_id: 2,
        title: "Third campaign",
        customer_title: "C Third campaign",
        project_id: 0,
        status_id: 2,
        campaign_type_id: 2,
        plan_id: 16, // plan from unquoted template
        quote_id: 55,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.CampaignPhase.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
  });

  it("Should return campaigns with all fields if query parameter FIELDS is not set", async () => {
    const response = await request(app)
      .get("/campaigns")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,3]}');
    expect(response.body.items.length).toBe(2);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        {
          id: 1,
          name: "First campaign",
          startDate: "2023-01-13 10:10:10",
          endDate: "2023-01-14 10:10:10",
          customerTitle: "C First campaign",
          csm: { id: 1, name: "name", surname: "surname" },
          project: { id: campaign.project_id, name: "Project 1" },
          customer: { id: 1, name: "Company 1" },
          status: "running",
          type: { name: "CampaignType 1", area: "quality" },
          visibility: "admin",
          resultType: "bug",
          phase: { id: 1, name: "Draft" },
          roles: [],
          quote: { id: 50, price: "2 kilotons", status: "confirmed" },
        },
        {
          id: 3,
          name: "Third campaign",
          startDate: "2023-01-13 10:10:10",
          endDate: "2023-01-14 10:10:10",
          customerTitle: "C Third campaign",
          csm: { id: 2, name: "test", surname: "test" },
          project: { name: "N.D." },
          customer: { name: "N.D." },
          status: "closed",
          type: { name: "CampaignType 2", area: "experience" },
          visibility: "admin",
          resultType: "bug",
          phase: { id: 1, name: "Draft" },
          roles: [],
          quote: { id: 55, price: "3000 electronvolts", status: "proposed" },
        },
      ])
    );
  });

  it("Should return just campaigns ids if fields is set with id", async () => {
    const response = await request(app)
      .get("/campaigns?fields=id")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,3]}');
    expect(response.body.items.length).toBe(2);
    expect(response.body.items).toEqual(
      expect.arrayContaining([{ id: 1 }, { id: 3 }])
    );
  });

  it("Should retrun just campaigns name if fields is set with name", async () => {
    const response = await request(app)
      .get("/campaigns?fields=name")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,3]}');
    expect(response.body.items.length).toBe(2);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        { name: "First campaign" },
        { name: "Third campaign" },
      ])
    );
  });

  it("Should retrun just csm data if field is set with csm", async () => {
    const response = await request(app)
      .get("/campaigns?fields=csm")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,3]}');
    expect(response.body.items.length).toBe(2);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        { csm: { id: 1, name: "name", surname: "surname" } },
        { csm: { id: 2, name: "test", surname: "test" } },
      ])
    );
  });
  it("Should return just customer title if field is set with customerTitle", async () => {
    const response = await request(app)
      .get("/campaigns?fields=customerTitle")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,3]}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        { customerTitle: "C First campaign" },
        { customerTitle: "C Third campaign" },
      ])
    );
  });

  it("Should return just project data if field is set with project", async () => {
    const response = await request(app)
      .get("/campaigns?fields=project")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,3]}');
    expect(response.body.items.length).toBe(2);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        {
          project: { id: campaign.project_id, name: "Project 1" },
        },
        {
          project: { name: "N.D." },
        },
      ])
    );
  });

  it("Should return just customer data if field is set with customer", async () => {
    const response = await request(app)
      .get("/campaigns?fields=customer")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,3]}');
    expect(response.body.items.length).toBe(2);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        {
          customer: { id: 1, name: "Company 1" },
        },
        {
          customer: { name: "N.D." },
        },
      ])
    );
  });

  it("Should retrun just campaigns id and name if field is set with id,name", async () => {
    const response = await request(app)
      .get("/campaigns?fields=name,id")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,3]}');
    expect(response.body.items.length).toBe(2);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        { id: 1, name: "First campaign" },
        { id: 3, name: "Third campaign" },
      ])
    );
  });
  it("Should retrun campaigns id,startDate,endDate if fields is set with id,startDate,endDate", async () => {
    const response = await request(app)
      .get("/campaigns?fields=startDate,endDate,id")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,3]}');
    expect(response.body.items.length).toBe(2);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        {
          id: 1,
          startDate: "2023-01-13 10:10:10",
          endDate: "2023-01-14 10:10:10",
        },
        {
          id: 3,
          startDate: "2023-01-13 10:10:10",
          endDate: "2023-01-14 10:10:10",
        },
      ])
    );
  });
  it("Should retrun campaigns id,status if fields is set with id,status", async () => {
    const response = await request(app)
      .get("/campaigns?fields=status,id")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,2,3]}');

    expect(response.body.items.length).toBe(3);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        {
          id: 1,
          status: "running",
        },
        {
          id: 2,
          status: "incoming",
        },
        {
          id: 3,
          status: "closed",
        },
      ])
    );
  });

  it("Should retrun campaigns id,type if fields is set with id,type", async () => {
    const response = await request(app)
      .get("/campaigns?fields=type,id")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,3]}');
    expect(response.body.items.length).toBe(2);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        {
          id: 1,
          type: { name: "CampaignType 1", area: "quality" },
        },
        {
          id: 3,
          type: { name: "CampaignType 2", area: "experience" },
        },
      ])
    );
  });

  it("Should retrun campaigns id,quote if fields is set with id,quote", async () => {
    const response = await request(app)
      .get("/campaigns?fields=quote,id")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,2,3]}');
    expect(response.body.items.length).toBe(3);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        {
          id: 1,
          quote: { id: 50, price: "2 kilotons", status: "confirmed" },
        },
        {
          id: 2,
        },
        {
          id: 3,
          quote: { id: 55, price: "3000 electronvolts", status: "proposed" },
        },
      ])
    );
  });
});
