import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const basicCampaign = {
  title: "Test Campaign",
  customer_title: "Test Campaign",
  min_allowed_media: 1,
  campaign_type: 0,
  bug_lang: 0,
  base_bug_internal_id: "I",
  start_date: "2020-01-01",
  end_date: "2020-01-01",
  close_date: "2020-01-01",
  campaign_type_id: 1,
  os: "",
  pm_id: 1,
  is_public: 0,
  page_manual_id: 0,
  page_preview_id: 0,
  status_id: 1,
  platform_id: 1,
  customer_id: 1,
  project_id: 1,
};

const basicUserField = {
  type: "select",
  name: "A select field",
  slug: "a-select-field",
  custom_user_field_group_id: 10,
  extras: "",
  placeholder: "",
};

describe("POST /campaigns/forms/ - screenout", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      ...basicCampaign,
      id: 1,
    });

    await tryber.tables.WpAppqCustomUserFieldGroups.do().insert({
      id: 10,
      name: "CUF group",
      description: "CUF group description",
    });

    await tryber.tables.WpAppqCustomUserField.do().insert({
      ...basicUserField,
      id: 1,
    });

    await tryber.tables.WpAppqCustomUserField.do().insert({
      ...basicUserField,
      id: 2,
    });
  });

  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqCustomUserField.do().delete();
  });

  afterEach(async () => {
    await tryber.tables.WpAppqCampaignPreselectionForm.do().delete();
    await tryber.tables.WpAppqCampaignPreselectionFormFields.do().delete();
  });

  it("Should save screenout options for select", async () => {
    const response = await request(app)
      .post("/campaigns/forms/")
      .send({
        name: "My form",
        fields: [
          {
            question: "Yes or no",
            type: "select",
            priority: 1,
            options: ["Yes", "No"],
            invalidOptions: ["No"],
          },
        ],
        creationDate: "2024-02-23 00:00:00",
      })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(201);
    const { id } = response.body;

    const get = await request(app)
      .get(`/campaigns/forms/${id}`)
      .set(
        "Authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );

    expect(get.status).toBe(200);
    expect(get.body.fields).toHaveLength(1);
    expect(get.body.fields[0]).toMatchObject({
      question: "Yes or no",
      invalidOptions: ["No"],
    });
  });
  it("Should save screenout options for multiselect", async () => {
    const response = await request(app)
      .post("/campaigns/forms/")
      .send({
        name: "My form",
        fields: [
          {
            question: "Select one",
            type: "multiselect",
            priority: 1,
            options: ["Blue", "Red", "Yellow"],
            invalidOptions: ["Blue", "Red"],
          },
        ],
        creationDate: "2024-02-23 00:00:00",
      })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(201);
    const { id } = response.body;

    const get = await request(app)
      .get(`/campaigns/forms/${id}`)
      .set(
        "Authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );

    expect(get.status).toBe(200);
    expect(get.body.fields).toHaveLength(1);
    expect(get.body.fields[0]).toMatchObject({
      question: "Select one",
      invalidOptions: ["Blue", "Red"],
    });
  });
  it("Should save screenout options for radio", async () => {
    const response = await request(app)
      .post("/campaigns/forms/")
      .send({
        name: "My form",
        fields: [
          {
            question: "Yes or no",
            type: "radio",
            priority: 1,
            options: ["Yes", "No"],
            invalidOptions: ["No"],
          },
        ],
        creationDate: "2024-02-23 00:00:00",
      })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(201);
    const { id } = response.body;

    const get = await request(app)
      .get(`/campaigns/forms/${id}`)
      .set(
        "Authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );

    expect(get.status).toBe(200);
    expect(get.body.fields).toHaveLength(1);
    expect(get.body.fields[0]).toMatchObject({
      question: "Yes or no",
      invalidOptions: ["No"],
    });
  });
  it("Should save screenout options for cuf", async () => {
    const response = await request(app)
      .post("/campaigns/forms/")
      .send({
        name: "My form",
        fields: [
          {
            question: "Electricity",
            type: "cuf_1",
            priority: 1,
            options: [1, 2, 3],
            invalidOptions: [1, 2],
          },
        ],
        creationDate: "2024-02-23 00:00:00",
      })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(201);
    const { id } = response.body;

    const get = await request(app)
      .get(`/campaigns/forms/${id}`)
      .set(
        "Authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );

    expect(get.status).toBe(200);
    expect(get.body.fields).toHaveLength(1);
    expect(get.body.fields[0]).toMatchObject({
      question: "Electricity",
      invalidOptions: [1, 2],
    });
  });
});
