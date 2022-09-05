import app from "@src/app";
import request from "supertest";
import PreselectionForm from "@src/__mocks__/mockedDb/preselectionForm";
import PreselectionFormFields from "@src/__mocks__/mockedDb/preselectionFormFields";
import CustomUserFields from "@src/__mocks__/mockedDb/customUserFields";

const sampleBody = {
  name: "My form",
  fields: [],
};
const sampleBodyWithFields = {
  name: "My form",
  fields: [
    {
      id: 1,
      type: "text",
      question: "My text question",
    },
    {
      id: 2,
      type: "cuf_1",
      question: "My text cuf question",
    },
    {
      id: 3,
      type: "cuf_2",
      options: [1, 2],
      question: "My select cuf question",
    },
    {
      id: 4,
      type: "select",
      options: ["option1", "option2"],
      question: "My select question",
    },
  ],
};
describe("PUT /campaigns/forms/", () => {
  beforeAll(() => {
    CustomUserFields.insert({
      id: 1,
      type: "text",
    });
    CustomUserFields.insert({
      id: 2,
      type: "multiselect",
    });
  });
  afterAll(() => {
    CustomUserFields.clear();
  });
  beforeEach(() => {
    PreselectionForm.insert({
      id: 1,
      name: "My empty form",
    });
    PreselectionForm.insert({
      id: 2,
      name: "My empty form linked to campaign",
      campaign_id: 1,
    });
    PreselectionForm.insert({
      id: 3,
      name: "My form",
    });
    PreselectionForm.insert({
      id: 4,
      name: "My empty form linked to campaign with access granted",
      campaign_id: 2,
    });
    PreselectionFormFields.insert({
      id: 1,
      form_id: 3,
      type: "text",
    });
    PreselectionFormFields.insert({
      id: 2,
      form_id: 3,
      type: "cuf_1",
    });
    PreselectionFormFields.insert({
      id: 3,
      form_id: 3,
      type: "cuf_2",
      options: JSON.stringify([1, 2]),
    });
    PreselectionFormFields.insert({
      id: 4,
      form_id: 3,
      type: "select",
      options: JSON.stringify(["option1", "option2"]),
    });
  });
  afterEach(() => {
    PreselectionForm.clear();
    PreselectionFormFields.clear();
  });
  it("Should return 403 if user doesn't have the tester capability manage_preselection_forms", async () => {
    const response = await request(app)
      .put("/campaigns/forms/1")
      .send({ ...sampleBody })
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 404 if form does not exists", async () => {
    const response = await request(app)
      .put("/campaigns/forms/10")
      .send({ ...sampleBody })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(404);
  });
  it("Should return 403 if the form is linked and user doesn't have access to it", async () => {
    const response = await request(app)
      .put("/campaigns/forms/2")
      .send({ ...sampleBody })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(403);
  });

  it("Should return 200 if user has the tester capability manage_preselection_forms", async () => {
    const response = await request(app)
      .put("/campaigns/forms/1")
      .send({ ...sampleBody })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(200);
  });

  it("Should return 200 if form is linked and user has the capability and the olp", async () => {
    const response = await request(app)
      .put("/campaigns/forms/4")
      .send({ ...sampleBody })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"] olp {"appq_campaign":[2]}`
      );
    expect(response.status).toBe(200);
  });

  it("Should edit the name", async () => {
    const response = await request(app)
      .put("/campaigns/forms/1")
      .send({ ...sampleBody, name: "New name" })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body).toHaveProperty("name", "New name");
    const form = await PreselectionForm.all(undefined, [{ id: 1 }]);
    expect(form.length).toBe(1);
    expect(form[0]).toHaveProperty("name", "New name");
  });

  it("Should allow adding a new question", async () => {
    const fieldsBeforeRequest = await PreselectionFormFields.all(undefined, [
      { form_id: 3 },
    ]);
    const response = await request(app)
      .put("/campaigns/forms/3")
      .send({
        ...sampleBodyWithFields,
        fields: [
          ...sampleBodyWithFields.fields,
          { type: "text", question: "My question" },
        ],
      })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(200);
    const fieldsAfterRequest = await PreselectionFormFields.all(undefined, [
      { form_id: 3 },
    ]);
    expect(fieldsAfterRequest.length).toBe(fieldsBeforeRequest.length + 1);
    const newField = fieldsAfterRequest.find((field) => {
      return !fieldsBeforeRequest.find(
        (fieldBefore) => fieldBefore.id === field.id
      );
    });
    expect(newField).toHaveProperty("type", "text");
    expect(newField).toHaveProperty("question", "My question");
  });

  it("Should allow editing a question", async () => {
    const fieldsBeforeRequest = await PreselectionFormFields.all(undefined, [
      { form_id: 3 },
    ]);
    const response = await request(app)
      .put("/campaigns/forms/3")
      .send({
        ...sampleBodyWithFields,
        fields: sampleBodyWithFields.fields.map((field) => {
          if (field.id === 1) {
            return { ...field, question: "New question" };
          }
          return field;
        }),
      })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(200);
    const fieldsAfterRequest = await PreselectionFormFields.all(undefined, [
      { form_id: 3 },
    ]);
    expect(fieldsAfterRequest.length).toBe(fieldsBeforeRequest.length);
    const changedFields = await PreselectionFormFields.all(undefined, [
      { id: 1 },
    ]);
    expect(changedFields.length).toBe(1);
    expect(changedFields[0]).toHaveProperty("question", "New question");
  });
});
