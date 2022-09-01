import app from "@src/app";
import request from "supertest";
import PreselectionForm from "@src/__mocks__/mockedDb/preselectionForm";
import PreselectionFormFields from "@src/__mocks__/mockedDb/preselectionFormFields";
import Campaign from "@src/__mocks__/mockedDb/campaign";

describe("GET /campaigns/{campaignId}/forms/{formId}", () => {
  beforeAll(() => {
    Campaign.insert({ id: 1, title: "My campaign" });
    PreselectionForm.insert({ id: 2, campaign_id: 1, name: "The form" });
    PreselectionForm.insert({ id: 1, name: "The form" });
    PreselectionFormFields.insert({
      id: 1,
      form_id: 1,
      type: "text",
      question: "Text question",
    });
    PreselectionFormFields.insert({
      id: 2,
      form_id: 1,
      question: "Select question",
      type: "select",
      options: JSON.stringify(["Option 1", "Option 2"]),
    });
    PreselectionFormFields.insert({
      id: 3,
      form_id: 1,
      question: "Multiselect question",
      type: "multiselect",
      options: JSON.stringify(["Option 3", "Option 4"]),
    });
    PreselectionFormFields.insert({
      id: 4,
      form_id: 1,
      question: "Radio question",
      type: "radio",
      options: JSON.stringify(["Yes", "No"]),
    });
    PreselectionFormFields.insert({
      id: 5,
      form_id: 1,
      question: "Gender question",
      type: "gender",
    });
    PreselectionFormFields.insert({
      id: 6,
      form_id: 1,
      question: "Phone question",
      type: "phone_number",
    });
    PreselectionFormFields.insert({
      id: 7,
      form_id: 1,
      question: "Address question",
      type: "address",
    });
    PreselectionFormFields.insert({
      id: 8,
      form_id: 1,
      question: "Cuf question",
      type: "cuf_1",
      options: JSON.stringify([1, 2, 3]),
    });
  });
  afterAll(() => {
    Campaign.clear();
    PreselectionForm.clear();
    PreselectionFormFields.clear();
  });
  it("Should return 403 if user doesn't have the tester capability manage_preselection_forms", async () => {
    const response = await request(app)
      .get("/campaigns/forms/1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 200 if user has the tester capability manage_preselection_forms", async () => {
    const response = await request(app)
      .get("/campaigns/forms/1")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(200);
  });

  it("Should return 404 if form does not exists", async () => {
    const response = await request(app)
      .get("/campaigns/forms/10")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(404);
  });

  it("Should return the id of the form", async () => {
    const response = await request(app)
      .get("/campaigns/forms/1")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body).toHaveProperty("id", 1);
  });

  it("Should return the name of the form", async () => {
    const response = await request(app)
      .get("/campaigns/forms/1")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body).toHaveProperty("name", "The form");
  });

  it("Should return a list of fields", async () => {
    const response = await request(app)
      .get("/campaigns/forms/1")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body).toHaveProperty("fields");
    expect(response.body.fields).toEqual([
      { id: 1, type: "text", question: "Text question" },
      {
        id: 2,
        type: "select",
        options: ["Option 1", "Option 2"],
        question: "Select question",
      },
      {
        id: 3,
        type: "multiselect",
        options: ["Option 3", "Option 4"],
        question: "Multiselect question",
      },
      {
        id: 4,
        type: "radio",
        options: ["Yes", "No"],
        question: "Radio question",
      },
      { id: 5, type: "gender", question: "Gender question" },
      { id: 6, type: "phone_number", question: "Phone question" },
      { id: 7, type: "address", question: "Address question" },
      { id: 8, type: "cuf_1", options: [1, 2, 3], question: "Cuf question" },
    ]);
  });

  it("Should return the linked campaign if is present", async () => {
    const response = await request(app)
      .get("/campaigns/forms/2")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body).toHaveProperty("campaign", {
      id: 1,
      name: "My campaign",
    });
  });
});
