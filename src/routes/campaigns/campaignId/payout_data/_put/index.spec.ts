import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

describe("GET /campaigns/campaignId/payouts", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().insert({
      id: 1,
      wp_user_id: 1,
      email: "user@example.com",
      employment_id: 1,
      education_id: 1,
    });
    await tryber.tables.WpAppqProject.do().insert({
      display_name: "Test Project",
      id: 15,
      customer_id: 15,
      edited_by: 1,
    });
    await tryber.tables.CpReqTemplates.do().insert({
      id: 30,
      name: "Template 30",
      config: "{}",
    });
    await tryber.tables.CpReqPlans.do().insert({
      id: 2,
      name: "Form CP2",
      config: "{}",
      created_by: 1,
      project_id: 15,
    });
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
        campaign_pts: 200,
        campaign_type_id: 1,
      },
      {
        id: 2,
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
        campaign_pts: 200,
        campaign_type_id: 9,
        plan_id: 2,
      },
    ]);
    await tryber.tables.WpAppqCampaignType.do().insert([
      {
        id: 1,
        name: "functional",
        description: "functional description",
        category_id: 1,
      },
      {
        id: 9,
        name: "ux",
        description: "ux description",
        category_id: 1,
      },
    ]);
    await tryber.tables.WpAppqCampaignPreselectionForm.do().insert([
      {
        id: 10,
        name: "Form CP99",
        campaign_id: 99,
        creation_date: "2020-01-01 00:00:00",
      },
      {
        id: 20,
        name: "Form CP2",
        campaign_id: 2,
        creation_date: "2024-01-01 00:00:00",
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.WpAppqCampaignPreselectionForm.do().delete();
    await tryber.tables.WpAppqProject.do().delete();
    await tryber.tables.CpReqTemplates.do().delete();
    await tryber.tables.CpReqPlans.do().delete();
  });
});
