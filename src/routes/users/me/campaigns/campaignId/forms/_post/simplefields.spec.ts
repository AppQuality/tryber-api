import app from "@src/app";
import request from "supertest";
import campaign from "@src/__mocks__/mockedDb/campaign";
import testerDevice from "@src/__mocks__/mockedDb/testerDevice";
import preselectionFormData from "@src/__mocks__/mockedDb/preselectionFormData";
import preselectionFormFields from "@src/__mocks__/mockedDb/preselectionFormFields";
import preselectionForm from "@src/__mocks__/mockedDb/preselectionForm";

describe("POST users/me/campaigns/:campaignId/forms - simple fields", () => {
  beforeEach(() => {
    campaign.insert({
      id: 1,
      start_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      is_public: 1,
      os: "1,2",
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
    testerDevice.insert({
      id: 1,
      id_profile: 1,
      enabled: 1,
      platform_id: 1,
    });
  });

  afterEach(() => {
    campaign.clear();
    testerDevice.clear();
    preselectionFormData.clear();
    preselectionFormFields.clear();
    preselectionForm.clear();
  });

  it("Should save in form data table a simple text field", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
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
        device: [1],
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
        device: [1],
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
        device: [1],
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
        device: [1],
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
});
