import app from "@src/app";
import request from "supertest";
import campaign from "@src/__mocks__/mockedDb/campaign";
import pageAccess from "@src/__mocks__/mockedDb/pageAccess";
import preselectionForms from "@src/__mocks__/mockedDb/preselectionForm";
import preselectionFormFields from "@src/__mocks__/mockedDb/preselectionFormFields";
import customUserFields from "@src/__mocks__/mockedDb/customUserFields";
import customUserFieldsExtras from "@src/__mocks__/mockedDb/customUserFieldsExtra";
import customUserFieldsData from "@src/__mocks__/mockedDb/customUserFieldsData";
import profile from "@src/__mocks__/mockedDb/profile";

describe("GET users/me/campaigns/:campaignId/forms", () => {
  beforeAll(async () => {
    profile.insert({
      sex: 1,
      country: "Italy",
      city: "Rome",
      phone_number: "+393331234567",
    });
    campaign.insert({
      id: 1,
      is_public: 1,
    });
    preselectionForms.insert({
      id: 1,
      campaign_id: 1,
    });
    preselectionFormFields.insert({
      id: 1,
      form_id: 1,
      type: "text",
      question: "What is your dog name?",
    });
    preselectionFormFields.insert({
      id: 2,
      form_id: 1,
      type: "select",
      question: "What is your dog breed?",
      options: "Bulldog, Poodle, Labrador",
    });
    preselectionFormFields.insert({
      id: 3,
      form_id: 1,
      type: "multiselect",
      question: "What vaccines has your dog received?",
      options: "Rabies, Parvovirus, Distemper",
    });
    preselectionFormFields.insert({
      id: 4,
      form_id: 1,
      type: "cuf_1",
      question: "What is your telegram username?",
    });
    customUserFields.insert({
      id: 1,
      name: "Telegram",
      type: "text",
      options: "^@[a-zA-Z0-9_]$;Invalid telegram username",
    });
    customUserFieldsData.insert({
      id: 1,
      custom_user_field_id: 1,
      profile_id: 1,
      value: "@pippo",
    });
    preselectionFormFields.insert({
      id: 5,
      form_id: 1,
      type: "cuf_2",
      question: "How may children do you have?",
      options: "[1,2]",
    });
    customUserFields.insert({
      id: 2,
      name: "Children",
      type: "select",
    });
    customUserFieldsData.insert({
      id: 2,
      custom_user_field_id: 2,
      profile_id: 1,
      value: "1",
    });
    customUserFieldsExtras.insert({
      id: 1,
      name: "0",
      custom_user_field_id: 2,
    });
    customUserFieldsExtras.insert({
      id: 2,
      name: "1",
      custom_user_field_id: 2,
    });
    customUserFieldsExtras.insert({
      id: 3,
      name: "2+",
      custom_user_field_id: 2,
    });
    preselectionFormFields.insert({
      id: 6,
      form_id: 1,
      type: "cuf_3",
      question: "Select the banks in which you have an account",
      options: "[5,6]",
    });
    customUserFields.insert({
      id: 3,
      name: "Bank",
      type: "multiselect",
    });
    customUserFieldsExtras.insert({
      id: 4,
      name: "Banca Transilvania",
      custom_user_field_id: 3,
    });
    customUserFieldsExtras.insert({
      id: 5,
      name: "Banca Romaneasca",
      custom_user_field_id: 3,
    });
    customUserFieldsExtras.insert({
      id: 6,
      name: "Banca Comerciala Romana",
      custom_user_field_id: 3,
    });
    customUserFieldsData.insert({
      id: 4,
      custom_user_field_id: 3,
      profile_id: 1,
      value: "4",
    });
    customUserFieldsData.insert({
      id: 5,
      custom_user_field_id: 3,
      profile_id: 1,
      value: "5",
    });

    preselectionFormFields.insert({
      id: 7,
      form_id: 1,
      type: "gender",
      question: "What gender do you identify with?",
    });
    preselectionFormFields.insert({
      id: 8,
      form_id: 1,
      type: "phone_number",
      question: "What is your phone number",
    });
    preselectionFormFields.insert({
      id: 9,
      form_id: 1,
      type: "address",
      question: "What city do you live in?",
    });
    preselectionFormFields.insert({
      id: 10,
      form_id: 1,
      type: "cuf_4",
      question: "What is your favorite color?",
      options: "[8,9]",
    });
    customUserFields.insert({
      id: 4,
      name: "Color",
      type: "select",
    });
    customUserFieldsData.insert({
      id: 3,
      custom_user_field_id: 4,
      profile_id: 1,
      value: "7",
    });
    customUserFieldsExtras.insert({
      id: 7,
      name: "Blue",
      custom_user_field_id: 4,
    });
    customUserFieldsExtras.insert({
      id: 8,
      name: "Red",
      custom_user_field_id: 4,
    });
    customUserFieldsExtras.insert({
      id: 9,
      name: "Green",
      custom_user_field_id: 4,
    });

    campaign.insert({
      id: 2,
      page_preview_id: 1,
    });
    preselectionForms.insert({
      id: 2,
      campaign_id: 2,
    });
    pageAccess.insert({
      id: 1,
      view_id: 1,
      tester_id: 1,
    });

    campaign.insert({
      id: 3,
      page_preview_id: 1,
      start_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    });
    preselectionForms.insert({
      id: 3,
      campaign_id: 3,
    });

    campaign.insert({
      id: 4,
      is_public: 1,
    });
  });
  afterAll(async () => {
    campaign.clear();
    pageAccess.clear();
    preselectionFormFields.clear();
    preselectionForms.clear();
    customUserFields.clear();
    customUserFieldsExtras.clear();
    customUserFieldsData.clear();
    profile.clear();
  });

  it("Should return 403 if user is not authenticated", async () => {
    const response = await request(app).get("/users/me/campaigns/1/forms");
    expect(response.status).toBe(403);
  });
  it("Should return 404 if campaign does not exists", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/100/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(404);
  });
  it("Should return 200 if campaign has logged user access", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should return 200 if campaign has selected user access and user is selected", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/2/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should return 404 if campaign is already started", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/3/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(404);
  });
  it("Should return 404 if campaign doesn't have a form linked", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/4/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(404);
  });

  it("Should return 200 with the form fields and a text field if exists", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          type: "text",
          question: "What is your dog name?",
        }),
      ])
    );
  });

  it("Should return 200 with the form fields and a select field if exists", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 2,
          type: "select",
          question: "What is your dog breed?",
          options: ["Bulldog", "Poodle", "Labrador"],
        }),
      ])
    );
  });
  it("Should return 200 with the form fields and a multiselect field if exists", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 3,
          type: "multiselect",
          question: "What vaccines has your dog received?",
          options: ["Rabies", "Parvovirus", "Distemper"],
        }),
      ])
    );
  });

  it("Should return 200 with the form fields and a cuf text field if exists", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 4,
          type: "cuf_1",
          question: "What is your telegram username?",
          validation: {
            regex: "^@[a-zA-Z0-9_]$",
            error: "Invalid telegram username",
          },
        }),
      ])
    );
  });
  it("Should return 200 with the form fields and a cuf select field if exists", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 5,
          type: "cuf_2",
          question: "How may children do you have?",
          options: [1, 2],
        }),
      ])
    );
  });
  it("Should return 200 with the form fields and a cuf multiselect field if exists", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 6,
          type: "cuf_3",
          question: "Select the banks in which you have an account",
          options: [5, 6],
        }),
      ])
    );
  });

  it("Should return 200 with the form fields and a gender field if exists", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 7,
          type: "gender",
          question: "What gender do you identify with?",
        }),
      ])
    );
  });
  it("Should return 200 with the form fields and a phone number field if exists", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 8,
          type: "phone_number",
          question: "What is your phone number",
          validation: {
            regex: "^\\+?[0-9]{12,14}$",
          },
        }),
      ])
    );
  });
  it("Should return 200 with the form fields and a domicile field if exists", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 9,
          type: "address",
          question: "What city do you live in?",
        }),
      ])
    );
  });

  it("Should return 200 with the form fields and a cuf text value if exists", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "cuf_1",
          value: "@pippo",
        }),
      ])
    );
  });

  it("Should return 200 with the form fields and a cuf select value if exists", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "cuf_2",
          value: 1,
        }),
      ])
    );
  });
  it("Should return 200 with the form fields and no cuf select value if exists but is not in the available options", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "cuf_4",
        }),
      ])
    );
    expect(response.body).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "cuf_4",
          value: expect.anything(),
        }),
      ])
    );
  });

  it("Should return 200 with the form fields and a cuf multiselect value if exists, limited by available", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "cuf_3",
          value: [5],
        }),
      ])
    );
  });

  it("Should return 200 with the form fields and the gender value if exists", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "gender",
          value: "male",
        }),
      ])
    );
  });

  it("Should return 200 with the form fields and the phone number value if exists", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "phone_number",
          value: "+393331234567",
        }),
      ])
    );
  });

  it("Should return 200 with the form fields and the phone number value if exists", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "address",
          value: {
            city: "Rome",
            country: "Italy",
          },
        }),
      ])
    );
  });
});

describe("GET users/me/campaigns/:campaignId/forms - empty profile", () => {
  beforeEach(async () => {
    profile.insert({
      id: 1,
      city: undefined,
      country: undefined,
      sex: undefined,
    });
    campaign.insert({
      id: 1,
      is_public: 1,
    });
    preselectionForms.insert({
      id: 1,
      campaign_id: 1,
    });
    preselectionFormFields.insert({
      id: 7,
      form_id: 1,
      type: "gender",
      question: "What gender do you identify with?",
    });
    preselectionFormFields.insert({
      id: 8,
      form_id: 1,
      type: "phone_number",
      question: "What is your phone number",
    });
    preselectionFormFields.insert({
      id: 9,
      form_id: 1,
      type: "address",
      question: "What city do you live in?",
    });
  });
  afterEach(() => {
    profile.clear();
    campaign.clear();
    preselectionForms.clear();
    preselectionFormFields.clear();
  });

  it("Should not have a value for gender question", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "gender",
        }),
      ])
    );
    expect(response.body).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "gender",
          value: expect.anything(),
        }),
      ])
    );
  });

  it("Should not have a value for phone question", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "phone_number",
        }),
      ])
    );
    expect(response.body).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "phone_number",
          value: expect.anything(),
        }),
      ])
    );
  });

  it("Should not have a value for address question", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "address",
        }),
      ])
    );
    expect(response.body).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "address",
          value: expect.anything(),
        }),
      ])
    );
  });
  it("Should return only country as value if no city is available for address question", async () => {
    profile.clear();
    profile.insert({
      id: 1,
      city: undefined,
      country: "Italy",
    });
    const response = await request(app)
      .get("/users/me/campaigns/1/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "address",
          value: {
            country: "Italy",
          },
        }),
      ])
    );
  });
});
