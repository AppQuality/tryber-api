import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

jest.mock("@src/features/wp/WordpressJsonApiTrigger");
jest.mock("@src/features/webhookTrigger");

const baseRequest = {
  project: 1,
  testType: 1,
  title: {
    customer: "Campaign Title for Customer",
    tester: "Campaign Title for Tester",
  },
  startDate: "2019-08-24T14:15:22Z",
  deviceList: [1],
};

describe("Route POST /dossiers - visibility criteria for testers", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqProject.do().insert({
      id: 1,
      display_name: "Test Project",
      customer_id: 1,
      edited_by: 1,
    });

    await tryber.tables.WpAppqCampaignType.do().insert({
      id: 1,
      name: "Test Type",
      description: "Test Description",
      category_id: 1,
    });

    await tryber.tables.WpAppqEvdPlatform.do().insert([
      {
        id: 1,
        name: "Test Type",
        form_factor: 0,
        architecture: 1,
      },
    ]);
    await tryber.tables.WpAppqCustomUserField.do().insert([
      {
        id: 10,
        slug: "test_cuf1",
        name: "Test CUF 1",
        placeholder: "Test CUF 1 Placeholder",
        extras: "Test CUF 1 Extras",
        type: "select",
        custom_user_field_group_id: 1,
      },
      {
        id: 20,
        slug: "test_cuf2",
        name: "Test CUF 2",
        placeholder: "Test CUF 2 Placeholder",
        extras: "Test CUF 2 Extras",
        type: "multiselect",
        custom_user_field_group_id: 2,
      },
      {
        id: 30,
        slug: "test_cuf3",
        name: "Test CUF 3",
        placeholder: "Test CUF 3 Placeholder",
        extras: "Test CUF 3 Extras",
        type: "text",
        custom_user_field_group_id: 3,
      },
    ]);
    await tryber.tables.WpAppqCustomUserFieldExtras.do().insert([
      {
        id: 100,
        custom_user_field_id: 10,
        name: "Test CUF 1 Value 1",
      },
      {
        id: 200,
        custom_user_field_id: 20,
        name: "Test CUF 2 Value 1",
      },
    ]);
  });

  beforeEach(async () => {});

  afterAll(async () => {
    await tryber.tables.WpAppqProject.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
    await tryber.tables.WpAppqCustomUserField.do().delete();
    await tryber.tables.WpAppqCustomUserFieldExtras.do().delete();
  });
  afterEach(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.CampaignDossierData.do().delete();
    await tryber.tables.CampaignDossierDataBrowsers.do().delete();
    await tryber.tables.CampaignDossierDataCountries.do().delete();
    await tryber.tables.CampaignDossierDataLanguages.do().delete();
    await tryber.tables.WpAppqCampaignAdditionalFields.do().delete();
    await tryber.tables.CampaignDossierDataCuf.do().delete();
    jest.clearAllMocks();
  });

  it("Should return an error if sending a CUF that does not exist", async () => {
    const response = await request(app)
      .post("/dossiers")
      .send({
        ...baseRequest,
        visibilityCriteria: [
          {
            id: 999, // Non-existent CUF ID
            name: "Non-existent CUF",
          },
          {
            id: 10, // Existing CUF ID
            name: "Test CUF 1 Value 1",
          }, // Existing CUF Extras
        ],
      })
      .set("Authorization", "Bearer admin");

    expect(response.status).toBe(406);
    expect(response.body).toMatchObject({
      message: "Invalid Custom User Field submitted",
    });
  });

  it("Should return an error if the CUF type is other than 'select' and 'multiselect'", async () => {
    const response = await request(app)
      .post("/dossiers")
      .send({
        ...baseRequest,
        visibilityCriteria: [
          {
            id: 30, // Existing CUF ID with type 'text'
            name: "Non-existent CUF value",
          },
          {
            id: 10, // Existing CUF ID
            name: "Test CUF 1 Value 1",
          }, // Existing CUF Extras
        ],
      })
      .set("Authorization", "Bearer admin");

    expect(response.status).toBe(406);
    expect(response.body).toMatchObject({
      message: "Invalid Custom User Field submitted",
    });
  });

  it("Should return 201 if send valid cuf", async () => {
    const response = await request(app)
      .post("/dossiers")
      .send({
        ...baseRequest,
        visibilityCriteria: [
          {
            id: 10, // Existing CUF ID
            name: "Test CUF 1 Value 1",
          }, // Existing CUF Extras
          {
            id: 20, // Existing CUF ID
            name: "Test CUF 2 Value 1",
          }, // Existing CUF Extras
        ],
      })
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(201);
  });
});
