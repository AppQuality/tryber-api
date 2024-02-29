import PreselectionForm from "@src/__mocks__/mockedDb/preselectionForm";
import PreselectionFormFields from "@src/__mocks__/mockedDb/preselectionFormFields";
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
  type: "text",
  name: "A text field",
  slug: "a-text-field",
  custom_user_field_group_id: 10,
  placeholder: "write something",
  extras: "",
};

const sampleBody = {
  name: "My form",
  fields: [],
  creationDate: "2024-02-23 00:00:00",
};

describe("POST /campaigns/forms/", () => {
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

  it("Should return 403 if user doesn't have the tester capability manage_preselection_forms", async () => {
    const response = await request(app)
      .post("/campaigns/forms/")
      .send(sampleBody)
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 201 if user has the tester capability manage_preselection_forms", async () => {
    const response = await request(app)
      .post("/campaigns/forms/")
      .send(sampleBody)
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(201);
  });
  it("Should return 406 if sending a form associated with a campaign that already has a form", async () => {
    const body = {
      ...sampleBody,
      fields: [],
      campaign: 1,
    };
    await request(app)
      .post("/campaigns/forms/")
      .send(body)
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    const result = await PreselectionForm.all(undefined, [{ campaign_id: 1 }]);
    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty("campaign_id", body.campaign);
    const responseNewFormSameCamapign = await request(app)
      .post("/campaigns/forms/")
      .send({ ...body, name: "New Form withsame campaign id" })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    const afterNewFormResult = await PreselectionForm.all(undefined, [
      { campaign_id: 1 },
    ]);
    expect(afterNewFormResult.length).toBe(1);
    expect(afterNewFormResult[0]).toHaveProperty("campaign_id", body.campaign);
    expect(responseNewFormSameCamapign.status).toBe(406);
    expect(responseNewFormSameCamapign.body).toMatchObject({
      message: "A form is already assigned to this campaign_id",
    });
  });
  it("Should create a new form on success and return its id", async () => {
    const response = await request(app)
      .post("/campaigns/forms/")
      .send(sampleBody)
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    const newForm = await PreselectionForm.all();
    expect(newForm.length).toBe(1);
    expect(response.body).toHaveProperty("id", newForm[0].id);
  });

  it("Should create a form with the specified name", async () => {
    const response = await request(app)
      .post("/campaigns/forms/")
      .send(sampleBody)
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    const newForm = await PreselectionForm.all(
      ["name"],
      [
        {
          id: response.body.id,
        },
      ]
    );
    expect(newForm.length).toBe(1);
    expect(newForm[0]).toHaveProperty("name", sampleBody.name);
    expect(response.body).toHaveProperty("name", sampleBody.name);
  });

  it("Should save the operator id in the form", async () => {
    const response = await request(app)
      .post("/campaigns/forms/")
      .send(sampleBody)
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    const newForm = await PreselectionForm.all(
      ["author"],
      [
        {
          id: response.body.id,
        },
      ]
    );
    expect(newForm.length).toBe(1);
    expect(newForm[0]).toHaveProperty("author", 1);
  });

  it("Should save the creation date on posting a new form", async () => {
    const response = await request(app)
      .post("/campaigns/forms/")
      .send(sampleBody)
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    const newForm = await tryber.tables.WpAppqCampaignPreselectionForm.do()
      .select("creation_date")
      .where("id", response.body.id);
    expect(newForm.length).toBe(1);
    expect(newForm[0]).toHaveProperty("creation_date", "2024-02-23 00:00:00");
  });

  it("Should save the creation date on posting a new form - default", async () => {
    const response = await request(app)
      .post("/campaigns/forms/")
      .send({
        name: "My form",
        fields: [],
      })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    const newForm = await tryber.tables.WpAppqCampaignPreselectionForm.do()
      .select("creation_date")
      .where("id", response.body.id);
    expect(newForm.length).toBe(1);
    expect(newForm[0]).toHaveProperty(
      "creation_date",
      new Date().toISOString().replace("T", " ").split(".")[0]
    );
  });

  it("Should create a field for each field passed as body", async () => {
    const textField = {
      question: "My text question",
      type: "text",
    };
    const body = {
      ...sampleBody,
      fields: [textField, textField, textField, textField],
    };
    await request(app)
      .post("/campaigns/forms/")
      .send(body)
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    const fields = await PreselectionFormFields.all();
    expect(fields.length).toBe(body.fields.length);
  });

  it("Should allow creating a text field", async () => {
    await checkValidTextField({
      question: "My text question",
      short_name: "My short name",
      type: "text",
    });
  });

  it("Should allow creating a select field", async () => {
    await checkValidFieldWithOptions({
      question: "My select question",
      type: "select",
      options: ["Option 1", "Option 2"],
    });
  });
  it("Should allow creating a multiselect field", async () => {
    await checkValidFieldWithOptions({
      question: "My multiselect question",
      type: "multiselect",
      options: ["Option 1", "Option 2"],
    });
  });

  it("Should allow creating a radio field", async () => {
    await checkValidFieldWithOptions({
      question: "My radio question",
      type: "radio",
      options: ["Option 1", "Option 2"],
    });
  });

  it("Should allow creating a gender field", async () => {
    await checkValidTextField({
      question: "My gender field",
      type: "gender",
    });
  });

  it("Should allow creating a address field", async () => {
    await checkValidTextField({
      question: "My address question",
      type: "address",
    });
  });

  it("Should allow creating a phone field", async () => {
    await checkValidTextField({
      question: "My phone question",
      type: "phone_number",
    });
  });

  it("Should allow creating a cuf text field", async () => {
    await checkValidTextField({
      question: "My cuf text question",
      type: "cuf_1",
    });
  });

  it("Should allow creating a cuf select field", async () => {
    await checkValidFieldWithOptions({
      question: "My cuf select question",
      type: "cuf_2",
      options: [1, 2],
    });
  });

  it("Should return 406 if trying to create a form with an inexistent cuf", async () => {
    const body = {
      ...sampleBody,
      fields: [
        {
          question: "My invalid question",
          type: "cuf_100",
        },
      ],
    };
    const response = await request(app)
      .post("/campaigns/forms/")
      .send(body)
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(406);
  });
  it("should create a new form with campaign id", async () => {
    const body = {
      ...sampleBody,
      fields: [],
      campaign: 1,
    };
    const response = await request(app)
      .post("/campaigns/forms/")
      .send(body)
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    const result = await tryber.tables.WpAppqCampaignPreselectionForm.do()
      .select("campaign_id")
      .where({ id: response.body.id });
    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty("campaign_id", body.campaign);
  });
  it("should return new form with campaign (id and name)", async () => {
    const body = {
      ...sampleBody,
      fields: [],
      campaign: 1,
    };
    const response = await request(app)
      .post("/campaigns/forms/")
      .send(body)
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body).toHaveProperty("campaign", {
      id: 1,
      name: "Test Campaign",
    });
  });
});

async function checkValidTextField({
  question,
  short_name,
  type,
}: {
  question: string;
  short_name?: string;
  type: string;
}) {
  const body = {
    ...sampleBody,
    fields: [
      {
        question,
        short_name,
        type,
      },
    ],
  };
  const response = await request(app)
    .post("/campaigns/forms/")
    .send(body)
    .set(
      "authorization",
      `Bearer tester capability ["manage_preselection_forms"]`
    );
  for (const field of response.body.fields) {
    const fieldInDatabase = await PreselectionFormFields.all(undefined, [
      {
        id: field.id,
      },
    ]);
    expect(fieldInDatabase.length).toBe(1);
    expect(fieldInDatabase[0]).toHaveProperty("question", question);
    if (short_name)
      expect(fieldInDatabase[0]).toHaveProperty("short_name", short_name);
    expect(fieldInDatabase[0]).toHaveProperty("type", type);
  }
}

async function checkValidFieldWithOptions({
  question,
  type,
  options,
}: {
  question: string;
  type: string;
  options: string[] | number[];
}) {
  const body = {
    ...sampleBody,
    fields: [
      {
        question,
        type,
        options,
      },
    ],
  };
  const response = await request(app)
    .post("/campaigns/forms/")
    .send(body)
    .set(
      "authorization",
      `Bearer tester capability ["manage_preselection_forms"]`
    );
  for (const field of response.body.fields) {
    const fieldInDatabase = await PreselectionFormFields.all(undefined, [
      {
        id: field.id,
      },
    ]);
    expect(fieldInDatabase.length).toBe(1);
    expect(fieldInDatabase[0]).toHaveProperty("question", question);
    expect(fieldInDatabase[0]).toHaveProperty("type", type);
    expect(fieldInDatabase[0]).toHaveProperty(
      "options",
      JSON.stringify(options)
    );
  }
}
