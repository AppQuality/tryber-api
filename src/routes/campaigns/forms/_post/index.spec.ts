import app from "@src/app";
import request from "supertest";
import PreselectionForm from "@src/__mocks__/mockedDb/preselectionForm";
import PreselectionFormFields from "@src/__mocks__/mockedDb/preselectionFormFields";
import CustomUserFields from "@src/__mocks__/mockedDb/customUserFields";

const sampleBody = {
  name: "My form",
  fields: [],
};
describe("POST /campaigns/forms/", () => {
  beforeAll(() => {
    CustomUserFields.insert({
      id: 1,
    });
    CustomUserFields.insert({
      id: 2,
    });
  });
  afterAll(() => {
    CustomUserFields.clear();
  });
  afterEach(() => {
    PreselectionForm.clear();
    PreselectionFormFields.clear();
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
});

async function checkValidTextField({
  question,
  type,
}: {
  question: string;
  type: string;
}) {
  const body = {
    ...sampleBody,
    fields: [
      {
        question,
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