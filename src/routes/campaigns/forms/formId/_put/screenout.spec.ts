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

const sampleBody = {
  name: "My form",
  fields: [],
};
describe("PUT /campaigns/forms/ - screenout", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      ...basicCampaign,
      id: 1,
    });

    await tryber.tables.WpAppqEvdCampaign.do().insert({
      ...basicCampaign,
      id: 2,
    });

    await tryber.tables.WpAppqEvdCampaign.do().insert({
      ...basicCampaign,
      id: 3,
    });

    await tryber.tables.WpAppqCustomUserFieldGroups.do().insert({
      id: 10,
      name: "CUF group",
      description: "CUF group description",
    });

    await tryber.tables.WpAppqCustomUserField.do().insert({
      id: 1,
      type: "text",
      name: "A text field",
      slug: "a-text-field",
      custom_user_field_group_id: 10,
      placeholder: "write something",
      extras: "",
    });

    await tryber.tables.WpAppqCustomUserField.do().insert({
      id: 2,
      type: "multiselect",
      name: "A multiselect field",
      slug: "a-multiselect-field",
      custom_user_field_group_id: 10,
      placeholder: "select something",
      extras: "",
    });
  });

  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqCustomUserField.do().delete();
  });

  beforeEach(async () => {
    await tryber.tables.WpAppqCampaignPreselectionForm.do().insert([
      {
        id: 1,
        name: "My empty form",
        creation_date: "2020-01-01 23:59:59",
      },
      {
        id: 2,
        name: "My empty form linked to campaign",
        campaign_id: 1,
        creation_date: "2020-01-01 23:59:59",
      },
      {
        id: 3,
        name: "My form",
        creation_date: "2020-01-01 23:59:59",
      },
      {
        id: 4,
        name: "My empty form linked to campaign with access granted",
        campaign_id: 2,
        creation_date: "2020-01-01 23:59:59",
      },
    ]);

    await tryber.tables.WpAppqCampaignPreselectionFormFields.do().insert({
      id: 1,
      form_id: 3,
      type: "text",
      question: "My text question",
      short_name: "My short_name question",
      priority: 3,
    });

    await tryber.tables.WpAppqCampaignPreselectionFormFields.do().insert({
      id: 2,
      form_id: 3,
      question: "My text cuf question",
      short_name: "My short_name cuf question",
      type: "cuf_1",
      priority: 2,
    });

    await tryber.tables.WpAppqCampaignPreselectionFormFields.do().insert({
      id: 3,
      form_id: 3,
      type: "cuf_2",
      question: "My cuf_2 cuf question",
      short_name: "My short_name cuf_2 cuf question",
      options: JSON.stringify([1, 2]),
      priority: 4,
    });

    await tryber.tables.WpAppqCampaignPreselectionFormFields.do().insert({
      id: 4,
      form_id: 3,
      type: "select",
      question: "My select question",
      short_name: "My short_name select question",
      options: JSON.stringify(["option1", "option2"]),
      priority: 1,
    });
  });

  afterEach(async () => {
    await tryber.tables.WpAppqCampaignPreselectionForm.do().delete();
    await tryber.tables.WpAppqCampaignPreselectionFormFields.do().delete();
  });

  it("Should save screenout options for select", async () => {
    const response = await request(app)
      .put("/campaigns/forms/1")
      .send({
        ...sampleBody,
        fields: [
          {
            question: "Yes or no",
            type: "select",
            options: [{ value: "Yes" }, { value: "No", isInvalid: true }],
          },
        ],
      })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(200);

    const get = await request(app)
      .get("/campaigns/forms/1")
      .set(
        "authorization",
        'Bearer tester capability ["manage_preselection_forms"]'
      );

    expect(get.status).toBe(200);
    expect(get.body.fields).toHaveLength(1);
    expect(get.body.fields[0]).toMatchObject({
      question: "Yes or no",
      options: [{ value: "Yes" }, { value: "No", isInvalid: true }],
    });
  });

  it("Should save screenout options for multiselect", async () => {
    const response = await request(app)
      .put("/campaigns/forms/1")
      .send({
        ...sampleBody,
        fields: [
          {
            question: "Select one",
            type: "multiselect",
            options: [
              { value: "Red", isInvalid: true },
              { value: "Blue", isInvalid: true },
              { value: "Yellow" },
            ],
          },
        ],
      })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(200);

    const get = await request(app)
      .get("/campaigns/forms/1")
      .set(
        "authorization",
        'Bearer tester capability ["manage_preselection_forms"]'
      );

    expect(get.status).toBe(200);
    expect(get.body.fields).toHaveLength(1);
    expect(get.body.fields[0]).toMatchObject({
      question: "Select one",
      options: [
        { value: "Red", isInvalid: true },
        { value: "Blue", isInvalid: true },
        { value: "Yellow" },
      ],
    });
  });

  it("Should save screenout options for radio", async () => {
    const response = await request(app)
      .put("/campaigns/forms/1")
      .send({
        ...sampleBody,
        fields: [
          {
            question: "Yes or no",
            type: "radio",
            options: [{ value: "Yes" }, { value: "No", isInvalid: true }],
          },
        ],
      })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(200);

    const get = await request(app)
      .get("/campaigns/forms/1")
      .set(
        "authorization",
        'Bearer tester capability ["manage_preselection_forms"]'
      );

    expect(get.status).toBe(200);
    expect(get.body.fields).toHaveLength(1);
    expect(get.body.fields[0]).toMatchObject({
      question: "Yes or no",
      options: [{ value: "Yes" }, { value: "No", isInvalid: true }],
    });
  });

  it("Should save screenout options for cuf", async () => {
    const response = await request(app)
      .put("/campaigns/forms/1")
      .send({
        ...sampleBody,
        fields: [
          {
            question: "Electricity",
            type: "cuf_1",
            options: [
              { value: 1, isInvalid: true },
              { value: 2, isInvalid: true },
              { value: 3 },
            ],
          },
        ],
      })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(200);

    const get = await request(app)
      .get("/campaigns/forms/1")
      .set(
        "authorization",
        'Bearer tester capability ["manage_preselection_forms"]'
      );

    expect(get.status).toBe(200);
    expect(get.body.fields).toHaveLength(1);
    expect(get.body.fields[0]).toMatchObject({
      question: "Electricity",
      options: [
        { value: 1, isInvalid: true },
        { value: 2, isInvalid: true },
        { value: 3 },
      ],
    });
  });
});
