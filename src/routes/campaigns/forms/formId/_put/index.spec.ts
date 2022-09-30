import app from "@src/app";
import request from "supertest";
import PreselectionForm from "@src/__mocks__/mockedDb/preselectionForm";
import PreselectionFormFields from "@src/__mocks__/mockedDb/preselectionFormFields";
import CustomUserFields from "@src/__mocks__/mockedDb/customUserFields";
import Campaign from "@src/__mocks__/mockedDb/campaign";

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
      short_name: "My short_name question",
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
    Campaign.insert({ id: 1 });
    Campaign.insert({ id: 2 });
    Campaign.insert({ id: 3 });
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
    Campaign.clear();
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
      priority: 3,
    });
    PreselectionFormFields.insert({
      id: 2,
      form_id: 3,
      type: "cuf_1",
      priority: 2,
    });
    PreselectionFormFields.insert({
      id: 3,
      form_id: 3,
      type: "cuf_2",
      options: JSON.stringify([1, 2]),
      priority: 4,
    });
    PreselectionFormFields.insert({
      id: 4,
      form_id: 3,
      type: "select",
      options: JSON.stringify(["option1", "option2"]),
      priority: 1,
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

  it("Should save the operator id in the form", async () => {
    const response = await request(app)
      .put("/campaigns/forms/1")
      .send({ ...sampleBody, name: "New name" })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body).toHaveProperty("name", "New name");
    const form = await PreselectionForm.all(["author"], [{ id: 1 }]);
    expect(form.length).toBe(1);
    expect(form[0]).toHaveProperty("author", 1);
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
  it("should update priority of form fields", async () => {
    const beforeOrderResponse = await request(app)
      .get("/campaigns/forms/3")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    const newOrderFields = beforeOrderResponse.body.fields;
    const first = newOrderFields[0];
    const last = newOrderFields[newOrderFields.length - 1];
    newOrderFields[0] = last;
    newOrderFields[newOrderFields.length - 1] = first;

    await request(app)
      .put("/campaigns/forms/3")
      .send({
        ...sampleBodyWithFields,
        fields: newOrderFields,
      })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    const afterOrderResponse = await request(app)
      .get("/campaigns/forms/3")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(afterOrderResponse.body.fields).toEqual(newOrderFields);
  });
  it("should update short_name of a form fields", async () => {
    const beforeChangesResponse = await request(app)
      .get("/campaigns/forms/3")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    const newFields = beforeChangesResponse.body.fields;
    const fieldWithNewShortName = {
      ...newFields[2],
      short_name: "New short_name",
    };
    newFields[2] = fieldWithNewShortName;

    await request(app)
      .put("/campaigns/forms/3")
      .send({
        ...sampleBodyWithFields,
        fields: newFields,
      })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    const afterChangesResponse = await request(app)
      .get("/campaigns/forms/3")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(afterChangesResponse.body.fields).toEqual(newFields);
    expect(afterChangesResponse.body.fields[2]).toHaveProperty(
      "short_name",
      fieldWithNewShortName.short_name
    );
  });
  it("should remove short_name of a form fields", async () => {
    const beforeChangesResponse = await request(app)
      .get("/campaigns/forms/3")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    const newFields = beforeChangesResponse.body.fields;
    const fieldWithNewShortName = { ...newFields[2], short_name: undefined };
    newFields[2] = fieldWithNewShortName;

    await request(app)
      .put("/campaigns/forms/3")
      .send({
        ...sampleBodyWithFields,
        fields: newFields,
      })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    const afterChangesResponse = await request(app)
      .get("/campaigns/forms/3")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(afterChangesResponse.body.fields).toEqual(newFields);
    expect(afterChangesResponse.body.fields[2]).not.toHaveProperty(
      "short_name"
    );
  });
  it("Should allow removing a question", async () => {
    const fieldsBeforeRequest = await PreselectionFormFields.all(undefined, [
      { form_id: 3 },
    ]);
    const response = await request(app)
      .put("/campaigns/forms/3")
      .send({
        ...sampleBodyWithFields,
        fields: sampleBodyWithFields.fields.filter((field) => field.id !== 1),
      })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(200);
    const fieldsAfterRequest = await PreselectionFormFields.all(undefined, [
      { form_id: 3 },
    ]);
    expect(fieldsAfterRequest.length).toBe(fieldsBeforeRequest.length - 1);
    const removedField = await PreselectionFormFields.all(undefined, [
      { id: 1 },
    ]);
    expect(removedField.length).toBe(0);
  });
  it("should update campaign id", async () => {
    await request(app)
      .put("/campaigns/forms/1")
      .send({
        ...sampleBodyWithFields,
        fields: [],
        campaign: 2,
      })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"] olp {"appq_campaign":true}`
      );
    const updateCampaignIdResponse = await request(app)
      .put("/campaigns/forms/1")
      .send({
        ...sampleBodyWithFields,
        fields: [],
        campaign: 3,
      })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"] olp {"appq_campaign":[2,3]}`
      );
    expect(updateCampaignIdResponse.body.campaign.id).toEqual(3);
    const results = await PreselectionForm.all(["campaign_id"], [{ id: 1 }]);
    expect(results.length).toBe(1);
    expect(results[0].campaign_id).toBe(3);
  });
  it("Should return 406 if sending a form associated with a campaign that already has a form", async () => {
    const body = {
      ...sampleBody,
      campaign: 1,
      name: "New Form with same campaign id",
    };
    const result = await PreselectionForm.all(undefined, [{ campaign_id: 1 }]);
    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty("campaign_id", body.campaign);
    const responseNewFormSameCamapign = await request(app)
      .put("/campaigns/forms/2")
      .send(body)
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"] olp {"appq_campaign":[1]}`
      );
    const afterNewFormResult = await PreselectionForm.all(undefined, [
      { campaign_id: 1 },
    ]);
    expect(afterNewFormResult.length).toBe(1);
    expect(afterNewFormResult[0]).toHaveProperty("campaign_id", body.campaign);
    expect(responseNewFormSameCamapign.status).toBe(406);
    expect(responseNewFormSameCamapign.body).toMatchObject({
      element: "element",
      id: 2,
      message: "A form is already assigned to this campaign_id",
    });
  });
});
