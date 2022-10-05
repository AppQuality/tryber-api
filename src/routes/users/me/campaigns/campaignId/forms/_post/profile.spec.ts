import app from "@src/app";
import request from "supertest";
import campaign from "@src/__mocks__/mockedDb/campaign";
import testerDevice from "@src/__mocks__/mockedDb/testerDevice";
import preselectionFormData from "@src/__mocks__/mockedDb/preselectionFormData";
import preselectionFormFields from "@src/__mocks__/mockedDb/preselectionFormFields";
import preselectionForm from "@src/__mocks__/mockedDb/preselectionForm";
import profile from "@src/__mocks__/mockedDb/profile";

describe("POST users/me/campaigns/:campaignId/forms - profile fields", () => {
  beforeEach(() => {
    profile.insert({ id: 1, sex: 1 });
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
      id: 7,
      form_id: 1,
      type: "gender",
    });
    preselectionFormFields.insert({
      id: 8,
      form_id: 1,
      type: "phone_number",
    });
    preselectionFormFields.insert({
      id: 9,
      form_id: 1,
      type: "address",
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
    profile.clear();
  });

  it("Should save in form data table a gender field", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 7,
            value: { serialized: "female" },
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
          field_id: 7,
          value: "female",
        }),
      ])
    );
  });
  it("Should save gender in profile table", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 7,
            value: { serialized: "female" },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const data = await profile.all(undefined, [{ id: 1 }]);
    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          sex: 0,
        }),
      ])
    );
  });

  it("Should return 403 if value of a gender is not one of the available options", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 7,
            value: { serialized: "pippo" },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should save in form data table a phone_number field", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 8,
            value: { serialized: "+393333333333" },
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
          field_id: 8,
          value: "+393333333333",
        }),
      ])
    );
  });

  it("Should return 403 if value of the phone_number doesn't match regex ", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 7,
            value: { serialized: "123" },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should save in form data table a address field", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 9,
            value: {
              serialized: {
                country: "Italy",
                city: "Rome",
              },
            },
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
          field_id: 9,
          value: "Rome, Italy",
        }),
      ])
    );
  });
});
