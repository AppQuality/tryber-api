import app from "@src/app";
import request from "supertest";
import campaign from "@src/__mocks__/mockedDb/campaign";
import testerDevice from "@src/__mocks__/mockedDb/testerDevice";
import preselectionFormData from "@src/__mocks__/mockedDb/preselectionFormData";
import preselectionFormFields from "@src/__mocks__/mockedDb/preselectionFormFields";
import preselectionForm from "@src/__mocks__/mockedDb/preselectionForm";
import customUserFields from "@src/__mocks__/mockedDb/customUserFields";
import customUserFieldsExtra from "@src/__mocks__/mockedDb/customUserFieldsExtra";
import customUserFieldsData from "@src/__mocks__/mockedDb/customUserFieldsData";
import campaignApplications from "@src/__mocks__/mockedDb/cpHasCandidates";

describe("POST users/me/campaigns/:campaignId/forms - cuf fields", () => {
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
    preselectionFormFields.insert({
      id: 6,
      form_id: 1,
      type: "cuf_3",
      options: "[4,5]",
    });
    customUserFields.insert({
      id: 3,
      type: "multiselect",
    });
    customUserFieldsExtra.insert({
      id: 3,
      name: "Banca 1",
      custom_user_field_id: 3,
    });
    customUserFieldsExtra.insert({
      id: 4,
      name: "Banca 2",
      custom_user_field_id: 3,
    });
    customUserFieldsExtra.insert({
      id: 5,
      name: "Banca 3",
      custom_user_field_id: 3,
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
    customUserFields.clear();
    customUserFieldsExtra.clear();
    campaignApplications.clear();
  });

  it("Should save in form data table a cuf text field", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
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
          tester_id: 1,
          value: "@pippo",
        }),
      ])
    );
  });

  it("Should save in cuf table a cuf text field", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 4,
            value: { serialized: "@pippo" },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const data = await customUserFieldsData.all(undefined, [
      { value: "@pippo", custom_user_field_id: 1, profile_id: 1 },
    ]);
    expect(data.length).toBe(1);
    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          custom_user_field_id: 1,
          profile_id: 1,
          value: "@pippo",
        }),
      ])
    );
  });

  it("Should return 403 if value of a text cuf doesn't match the regex", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
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
        device: [1],
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
          tester_id: 1,
          value: "Banca 1",
        }),
      ])
    );
  });

  it("Should save in cuf table a cuf select field", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 5,
            value: { id: 1, serialized: "Banca 1" },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const data = await customUserFieldsData.all(undefined, [
      { value: "1", custom_user_field_id: 2, profile_id: 1 },
    ]);
    expect(data.length).toBe(1);
    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          custom_user_field_id: 2,
          profile_id: 1,
          value: "1",
        }),
      ])
    );
  });

  it("Should return 403 if value of a select cuf is not one of the available fields", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
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

  it("Should save in form data table a cuf multiselect field", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 6,
            value: { id: [4, 5], serialized: ["Banca 2", "Banca 3"] },
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
          field_id: 6,
          tester_id: 1,
          value: "Banca 2",
        }),
        expect.objectContaining({
          campaign_id: 1,
          field_id: 6,
          tester_id: 1,
          value: "Banca 3",
        }),
      ])
    );
  });

  it("Should save in cuf table a cuf multiselect field", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 6,
            value: { id: [4, 5], serialized: ["Banca 2", "Banca 3"] },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const data = await customUserFieldsData.all();
    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          custom_user_field_id: 3,
          profile_id: 1,
          value: "4",
        }),
        expect.objectContaining({
          custom_user_field_id: 3,
          profile_id: 1,
          value: "5",
        }),
      ])
    );
  });

  it("Should return 403 if value of a multiselect cuf is not one of the available fields", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 6,
            value: { id: 3, serialized: "Banca 1" },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should save # in form data table if -1 is sent as id in a cuf select field", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 5,
            value: { id: -1, serialized: "#" },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    console.log(response.body);
    expect(response.status).toBe(200);
    const data = await preselectionFormData.all(undefined, [{ field_id: 5 }]);
    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_id: 5,
          tester_id: 1,
          value: "#",
        }),
      ])
    );
  });
  it("Should remove available options for a multiselect if present on this profile if -1 is sent", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 6,
            value: { id: [-1], serialized: ["#"] },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    const userCufData = await customUserFieldsData.all(undefined, [
      { custom_user_field_id: 3 },
    ]);
    expect(userCufData).toEqual([]);
  });
  it("Should add only # on preselection form data table if is sent -1 as a multiselect option", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({
        device: [1],
        form: [
          {
            question: 6,
            value: { id: [-1], serialized: ["#"] },
          },
        ],
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const data = await preselectionFormData.all(undefined, [{ field_id: 6 }]);
    expect(data).toEqual([
      {
        id: 1,
        campaign_id: 1,
        tester_id: 1,
        field_id: 6,
        value: "#",
      },
    ]);
  });
});
