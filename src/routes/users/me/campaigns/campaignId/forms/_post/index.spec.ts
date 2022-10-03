import app from "@src/app";
import request from "supertest";
import campaign from "@src/__mocks__/mockedDb/campaign";
import pageAccess from "@src/__mocks__/mockedDb/pageAccess";
import testerDevice from "@src/__mocks__/mockedDb/testerDevice";
import preselectionFormData from "@src/__mocks__/mockedDb/preselectionFormData";
import preselectionFormFields from "@src/__mocks__/mockedDb/preselectionFormFields";
import preselectionForm from "@src/__mocks__/mockedDb/preselectionForm";
import customUserFields from "@src/__mocks__/mockedDb/customUserFields";
import customUserFieldsExtra from "@src/__mocks__/mockedDb/customUserFieldsExtra";

describe("POST users/me/campaigns/:campaignId/forms", () => {
  beforeEach(() => {
    campaign.insert({
      id: 1,
      start_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      is_public: 1,
      os: "1,2",
    });
    campaign.insert({
      id: 2,
      start_date: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    });
    campaign.insert({
      id: 3,
      start_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      is_public: 3,
    });
    campaign.insert({
      id: 4,
      start_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      is_public: 3,
      page_preview_id: 1,
    });
    pageAccess.insert({
      view_id: 1,
      tester_id: 1,
    });
    preselectionForm.insert({
      id: 1,
      campaign_id: 1,
    });
    preselectionFormFields.insert({
      id: 1,
      form_id: 1,
      type: "text",
    });
    preselectionFormFields.insert({
      id: 2,
      form_id: 1,
      type: "select",
      options: '["option1","option2"]',
    });
    preselectionFormFields.insert({
      id: 3,
      form_id: 1,
      type: "multiselect",
      options: '["option1","option2"]',
    });
    preselectionFormFields.insert({
      id: 4,
      form_id: 1,
      type: "cuf_1",
    });
    customUserFields.insert({
      id: 1,
      type: "text",
      options: "^@[a-zA-Z0-9_]*$;Invalid telegram username",
    });
    preselectionFormFields.insert({
      id: 5,
      form_id: 1,
      type: "cuf_2",
      options: "[1]",
    });
    customUserFields.insert({
      id: 2,
      type: "select",
    });
    customUserFieldsExtra.insert({
      id: 1,
      name: "Banca 1",
      custom_user_field_id: 2,
    });
    customUserFieldsExtra.insert({
      id: 2,
      name: "Banca 2",
      custom_user_field_id: 2,
    });
    testerDevice.insert({
      id: 1,
      id_profile: 1,
      enabled: 1,
      platform_id: 1,
    });
    testerDevice.insert({
      id: 2,
      id_profile: 1,
      enabled: 1,
      platform_id: 4,
    });
  });

  afterEach(() => {
    campaign.clear();
    pageAccess.clear();
    testerDevice.clear();
    preselectionFormData.clear();
    preselectionFormFields.clear();
    preselectionForm.clear();
    customUserFields.clear();
    customUserFieldsExtra.clear();
  });
  it("Should return 403 if user is not authenticated", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({ device: 1 });
    expect(response.status).toBe(403);
  });
  it("Should return 404 if campaign does not exists", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/100/forms")
      .send({ device: 1 })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(404);
  });
  it("Should return 403 if application to the campaign is not available", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/2/forms")
      .send({ device: 1 })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should return 403 if tester cannot apply", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/3/forms")
      .send({ device: 1 })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should return 200 if campaign is public", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({ device: 1 })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should return 200 if campaign is small group and tester has access", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/4/forms")
      .send({ device: 1 })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should return 406 device is not sent", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({})
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(406);
  });
  it("Should return 403 device is not compatible with campaign", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({ device: 2 })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should save in form data table a simple text field", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: 1,
        form: [
          {
            question: 1,
            value: { serialized: "test" },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const data = await preselectionFormData.all(undefined, [
      { campaign_id: 1 },
    ]);
    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ campaign_id: 1, field_id: 1, value: "test" }),
      ])
    );
  });

  it("Should save in form data table a simple select field", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: 1,
        form: [
          {
            question: 2,
            value: { serialized: "option1" },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const data = await preselectionFormData.all(undefined, [
      { campaign_id: 1 },
    ]);
    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          campaign_id: 1,
          field_id: 2,
          value: "option1",
        }),
      ])
    );
  });
  it("Should return 403 if option of a simple select field is not available", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: 1,
        form: [
          {
            question: 2,
            value: { serialized: "option invalid" },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should save in form data table a simple multiselect field", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: 1,
        form: [
          {
            question: 3,
            value: { serialized: '["option1","option2"]' },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const data = await preselectionFormData.all(undefined, [
      { campaign_id: 1 },
    ]);
    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          campaign_id: 1,
          field_id: 3,
          value: "option1",
        }),
        expect.objectContaining({
          campaign_id: 1,
          field_id: 3,
          value: "option2",
        }),
      ])
    );
  });

  it("Should return 403 if option of a simple multiselect field is not available", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: 1,
        form: [
          {
            question: 3,
            value: { serialized: "option invalid" },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should save in form data table a cuf text field", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: 1,
        form: [
          {
            question: 4,
            value: { serialized: "@pippo" },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const data = await preselectionFormData.all(undefined, [
      { campaign_id: 1 },
    ]);
    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          campaign_id: 1,
          field_id: 4,
          value: "@pippo",
        }),
      ])
    );
  });

  it("Should return 403 if value of a text cuf doesn't match the regex", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: 1,
        form: [
          {
            question: 4,
            value: { serialized: "pippo" },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should save in form data table a cuf select field", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: 1,
        form: [
          {
            question: 5,
            value: { id: 1, serialized: "Banca 1" },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const data = await preselectionFormData.all(undefined, [
      { campaign_id: 1 },
    ]);
    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          campaign_id: 1,
          field_id: 5,
          value: "Banca 1",
        }),
      ])
    );
  });

  it("Should return 403 if value of a select cuf is not one of the available fields", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: 1,
        form: [
          {
            question: 5,
            value: { id: 2, serialized: "Banca 2" },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
});
