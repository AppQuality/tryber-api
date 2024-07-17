import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("GET /campaigns/forms/{formId} - screenout data", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 1,
      title: "My campaign",
      platform_id: 1,
      start_date: "2021-01-01",
      end_date: "2021-01-01",
      page_manual_id: 1,
      page_preview_id: 1,
      customer_id: 1,
      pm_id: 1,
      project_id: 1,
      customer_title: "My campaign",
    });
    await tryber.tables.WpAppqCampaignPreselectionForm.do().insert({
      id: 1,
      campaign_id: 1,
      name: "The form",
    });
    await tryber.tables.WpAppqCampaignPreselectionFormFields.do().insert([
      {
        id: 2,
        form_id: 1,
        question: "Select question",
        type: "select",
        options: JSON.stringify(["Option 1", "Option 2"]),
        priority: 2,
        invalid_options: JSON.stringify(["Option 1"]),
      },
      {
        id: 3,
        form_id: 1,
        question: "Multiselect question",
        type: "multiselect",
        options: JSON.stringify(["Option 3", "Option 4"]),
        priority: 3,
        invalid_options: JSON.stringify(["Option 3"]),
      },
      {
        id: 4,
        form_id: 1,
        question: "Radio question",
        type: "radio",
        options: JSON.stringify(["Yes", "No"]),
        priority: 4,
        invalid_options: JSON.stringify(["No"]),
      },
      {
        id: 8,
        form_id: 1,
        question: "Cuf question",
        type: "cuf_1",
        options: JSON.stringify([1, 2, 3]),
        priority: 1,
        invalid_options: JSON.stringify([1]),
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqCampaignPreselectionForm.do().delete();
    await tryber.tables.WpAppqCampaignPreselectionFormFields.do().delete();
  });

  it("Should return the invalid questions for select", async () => {
    const response = await request(app)
      .get("/campaigns/forms/1")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("fields");
    expect(response.body.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 2,
          invalidOptions: ["Option 1"],
        }),
      ])
    );
  });
  it("Should return the invalid questions for multiselect", async () => {
    const response = await request(app)
      .get("/campaigns/forms/1")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("fields");
    expect(response.body.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 3,
          invalidOptions: ["Option 3"],
        }),
      ])
    );
  });
  it("Should return the invalid questions for radio", async () => {
    const response = await request(app)
      .get("/campaigns/forms/1")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("fields");
    expect(response.body.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 4,
          invalidOptions: ["No"],
        }),
      ])
    );
  });
  it("Should return the invalid questions for cuf", async () => {
    const response = await request(app)
      .get("/campaigns/forms/1")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("fields");
    expect(response.body.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 8,
          invalidOptions: [1],
        }),
      ])
    );
  });
});
