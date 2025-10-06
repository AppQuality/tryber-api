import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const baseRequest = {
  project: 10,
  testType: 10,
  title: {
    customer: "Campaign Title for Customer",
    tester: "Campaign Title for Tester",
  },
  startDate: "2019-08-24T14:15:22Z",
  deviceList: [],
  autoApply: 0,
};

describe("Route POST /dossiers - plan", () => {
  beforeEach(async () => {
    await tryber.tables.WpAppqCampaignType.do().insert({
      id: 10,
      category_id: 1,
      name: "Test Campaign Type",
      description: "Test Description",
    });
    await tryber.tables.WpAppqProject.do().insert([
      {
        id: 1,
        display_name: "Test Project",
        customer_id: 1,
        edited_by: 1,
      },
      {
        id: 10,
        display_name: "New Project",
        customer_id: 10,
        edited_by: 1,
      },
    ]);
    await tryber.tables.WpAppqCustomer.do().insert([
      {
        id: 1,
        company: "Test Customer",
        pm_id: 1,
      },
      {
        id: 10,
        company: "New Customer",
        pm_id: 1,
      },
    ]);
    await tryber.tables.CpReqPlans.do().insert({
      id: 1,
      name: "Test Plan",
      config: "{}",
      project_id: 1,
      workspace_id: 1,
    });
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 1,
      project_id: 1,
      campaign_type_id: 1,
      title: "Test Campaign",
      customer_title: "Test Customer Campaign",
      start_date: "2019-08-24T14:15:22Z",
      end_date: "2019-08-24T14:15:22Z",
      platform_id: 0,
      os: "1",
      page_manual_id: 0,
      page_preview_id: 0,
      pm_id: 1,
      customer_id: 0,
      plan_id: 1,
    });
    await tryber.tables.CampaignDossierData.do().insert({
      id: 1,
      campaign_id: 1,
      link: "https://example.com",
      created_by: 1,
      updated_by: 1,
    });
  });

  it("should update the plan project and workspace", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .send({
        ...baseRequest,
      })
      .set("Authorization", "Bearer admin");

    const plan = await tryber.tables.CpReqPlans.do()
      .select("project_id", "workspace_id")
      .where({ id: 1 })
      .first();

    if (!plan) throw new Error("Plan not found");

    expect(plan.project_id).toBe(10);
    expect(plan.workspace_id).toBe(10);
  });
});
