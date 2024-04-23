import app from "@src/app";
import { tryber } from "@src/features/database";
import WordpressJsonApiTrigger from "@src/features/wp/WordpressJsonApiTrigger";
import request from "supertest";

jest.mock("@src/features/wp/WordpressJsonApiTrigger");

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

describe("Route POST /dossiers - duplication", () => {
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
  });

  beforeEach(async () => {});

  afterAll(async () => {
    await tryber.tables.WpAppqProject.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
  });
  afterEach(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.CampaignDossierData.do().delete();
    await tryber.tables.CampaignDossierDataBrowsers.do().delete();
    await tryber.tables.CampaignDossierDataCountries.do().delete();
    await tryber.tables.CampaignDossierDataLanguages.do().delete();
    await tryber.tables.WpAppqCampaignAdditionalFields.do().delete();

    jest.clearAllMocks();
  });

  it("Should post to wordpress if usecase is not duplicated", async () => {
    const response = await request(app)
      .post("/dossiers")
      .send(baseRequest)
      .set("Authorization", "Bearer admin");

    expect(response.status).toBe(201);

    const { id } = response.body;

    expect(WordpressJsonApiTrigger).toHaveBeenCalledTimes(1);
    expect(WordpressJsonApiTrigger).toHaveBeenCalledWith(id);

    expect(
      WordpressJsonApiTrigger.prototype.generateUseCase
    ).toHaveBeenCalledTimes(1);
  });

  it("Should post to wordpress if pages is not duplicated", async () => {
    const response = await request(app)
      .post("/dossiers")
      .send(baseRequest)
      .set("Authorization", "Bearer admin");

    expect(response.status).toBe(201);

    const { id } = response.body;

    expect(WordpressJsonApiTrigger).toHaveBeenCalledTimes(1);
    expect(WordpressJsonApiTrigger).toHaveBeenCalledWith(id);

    expect(
      WordpressJsonApiTrigger.prototype.generatePages
    ).toHaveBeenCalledTimes(1);
  });

  it("Should post to wordpress if mailmerge is not duplicated", async () => {
    const response = await request(app)
      .post("/dossiers")
      .send(baseRequest)
      .set("Authorization", "Bearer admin");

    expect(response.status).toBe(201);

    const { id } = response.body;

    expect(WordpressJsonApiTrigger).toHaveBeenCalledTimes(1);
    expect(WordpressJsonApiTrigger).toHaveBeenCalledWith(id);

    expect(
      WordpressJsonApiTrigger.prototype.generateMailMerges
    ).toHaveBeenCalledTimes(1);
  });
});
