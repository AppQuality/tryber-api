import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const baseRequest = {
  project: 1,
  testType: 1,
  title: {
    customer: "Campaign Title for Customer",
    tester: "Campaign Title for Tester",
  },
  startDate: "2019-08-24T14:15:22Z",
  deviceList: [1],
  autoApply: false,
};

describe("Route PUT /dossiers/:id", () => {
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

  afterAll(async () => {
    await tryber.tables.WpAppqProject.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
  });
  beforeEach(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 1,
      project_id: 1,
      campaign_type_id: 1,
      title: "Test Campaign",
      customer_title: "Test Customer Campaign",
      start_date: "2019-08-24T14:15:22Z",
      end_date: "2019-08-24T14:15:22Z",
      platform_id: 0,
      os: "1",
      page_manual_id: 0,
      page_preview_id: 0,
      pm_id: 1,
      customer_id: 0,
    });
  });
  afterEach(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.CampaignDossierData.do().delete();
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).put("/dossiers/1").send(baseRequest);
    expect(response.status).toBe(403);
  });

  it("Should answer 403 if campaign does not exists", async () => {
    const response = await request(app).put("/dossiers/10").send(baseRequest);
    expect(response.status).toBe(403);
  });

  it("Should answer 403 if not admin", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer tester")
      .send(baseRequest);
    expect(response.status).toBe(403);
  });

  it("Should answer 400 if project does not exists", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, project: 10 });
    expect(response.status).toBe(400);
  });

  it("Should answer 400 if test type does not exists", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, testType: 10 });
    expect(response.status).toBe(400);
  });

  it("Should answer 400 if device type does not exists", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, deviceList: [10] });
    expect(response.status).toBe(400);
  });

  it("Should answer 200 if admin", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send(baseRequest);
    expect(response.status).toBe(200);
  });

  it("Should answer 200 if user has access to the campaign", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .send(baseRequest)
      .set("authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(200);
  });

  it("Should answer 200 if user has access to the campaign", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .send(baseRequest)
      .set("authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
  });
  describe("Should set visibility criteria if sent - age criteria", () => {
    afterEach(async () => {
      await tryber.tables.CampaignDossierDataAge.do().delete();
    });
    it("Should answer 200 if send age visibility criteria", async () => {
      const response = await request(app)
        .put("/dossiers/1")
        .send({
          ...baseRequest,
          visibilityCriteria: {
            ageRanges: [
              { min: 19, max: 25 },
              { min: 26, max: 30 },
            ],
          },
        })
        .set("authorization", 'Bearer tester olp {"appq_campaign":true}');
      expect(response.status).toBe(200);
    });
    it("Should add age ranges if sent and not yet in campaign", async () => {
      const response = await request(app)
        .put("/dossiers/1")
        .send({
          ...baseRequest,
          visibilityCriteria: {
            ageRanges: [
              {
                min: 18,
                max: 25,
              },
              {
                min: 26,
                max: 35,
              },
            ],
          },
        })
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
      const dossierAge = await tryber.tables.CampaignDossierDataAge.do()
        .select("min", "max")
        .join(
          "campaign_dossier_data",
          "campaign_dossier_data_age.campaign_dossier_data_id",
          "campaign_dossier_data.id"
        )
        .where("campaign_dossier_data.campaign_id", response.body.id);
      expect(dossierAge).toHaveLength(2);

      expect(dossierAge).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            min: 18,
            max: 25,
          }),
          expect.objectContaining({
            min: 26,
            max: 35,
          }),
        ])
      );
    });
  });
  describe("Should set visibility criteria if sent - gender criteria", () => {
    afterEach(async () => {
      await tryber.tables.CampaignDossierDataGender.do().delete();
    });
    it("Should answer 200 if send gender visibility criteria", async () => {
      const response = await request(app)
        .put("/dossiers/1")
        .send({
          ...baseRequest,
          visibilityCriteria: {
            gender: [1, 0],
          },
        })
        .set("authorization", 'Bearer tester olp {"appq_campaign":true}');
      expect(response.status).toBe(200);
    });
    it("Should add gender if sent and not yet in campaign", async () => {
      const response = await request(app)
        .put("/dossiers/1")
        .send({
          ...baseRequest,
          visibilityCriteria: {
            gender: [1, 0],
          },
        })
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
      const dossierGender = await tryber.tables.CampaignDossierDataGender.do()
        .select("gender")
        .join(
          "campaign_dossier_data",
          "campaign_dossier_data_gender.campaign_dossier_data_id",
          "campaign_dossier_data.id"
        )
        .where("campaign_dossier_data.campaign_id", response.body.id);
      expect(dossierGender).toHaveLength(2);

      expect(dossierGender).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            gender: 0,
          }),
          expect.objectContaining({
            gender: 1,
          }),
        ])
      );
    });
  });
  describe("Should set visibility criteria if sent - cuf criteria", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqCustomUserField.do().insert([
        {
          id: 10,
          name: "CUF10",
          slug: "cuf10",
          placeholder: "CUF10 Placeholder",
          extras: "",
          custom_user_field_group_id: 1,
          type: "select",
        },
        {
          id: 20,
          name: "CUF20",
          slug: "cuf20",
          placeholder: "CUF20 Placeholder",
          extras: "",
          custom_user_field_group_id: 1,
          type: "multiselect",
        },
      ]);
      await tryber.tables.WpAppqCustomUserFieldExtras.do().insert([
        { id: 100, custom_user_field_id: 10, name: "CUF10 Extra1" },
        { id: 101, custom_user_field_id: 10, name: "CUF10 Extra2" },
        { id: 200, custom_user_field_id: 20, name: "CUF20 Extra1" },
        { id: 201, custom_user_field_id: 20, name: "CUF20 Extra2" },
      ]);
    });

    afterEach(async () => {
      await tryber.tables.CampaignDossierDataCuf.do().delete();
      await tryber.tables.WpAppqCustomUserField.do().delete();
      await tryber.tables.WpAppqCustomUserFieldExtras.do().delete();
    });
    it("Should return an error if send invalid cuf as cuf visibility criteria", async () => {
      const response = await request(app)
        .put("/dossiers/1")
        .send({
          ...baseRequest,
          visibilityCriteria: {
            cuf: [
              { cufId: 10, cufValueIds: [100, 101] },
              { cufId: 30, cufValueIds: [300, 301] },
            ],
          },
        })
        .set("authorization", 'Bearer tester olp {"appq_campaign":true}');
      expect(response.status).toBe(406);
      expect(response.body).toMatchObject({
        message: "Invalid Custom User Field submitted",
      });
    });
    it("Should answer 200 if send valid cuf visibility criteria", async () => {
      const response = await request(app)
        .put("/dossiers/1")
        .send({
          ...baseRequest,
          visibilityCriteria: {
            cuf: [
              { cufId: 10, cufValueIds: [100, 101] },
              { cufId: 20, cufValueIds: [200, 201] },
            ],
          },
        })
        .set("authorization", 'Bearer tester olp {"appq_campaign":true}');
      expect(response.status).toBe(200);
    });
    it("Should add cuf if sent valid cuf", async () => {
      const response = await request(app)
        .put("/dossiers/1")
        .send({
          ...baseRequest,
          visibilityCriteria: {
            cuf: [
              { cufId: 10, cufValueIds: [100, 101] },
              { cufId: 20, cufValueIds: [200, 201] },
            ],
          },
        })
        .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
      const dossierCuf = await tryber.tables.CampaignDossierDataCuf.do()
        .select("cuf_id", "cuf_value_id")
        .join(
          "campaign_dossier_data",
          "campaign_dossier_data_cuf.campaign_dossier_data_id",
          "campaign_dossier_data.id"
        )
        .where("campaign_dossier_data.campaign_id", response.body.id);
      expect(dossierCuf).toHaveLength(4);

      expect(dossierCuf).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            cuf_id: 10,
            cuf_value_id: 100,
          }),
          expect.objectContaining({
            cuf_id: 10,
            cuf_value_id: 101,
          }),
          expect.objectContaining({
            cuf_id: 20,
            cuf_value_id: 200,
          }),
          expect.objectContaining({
            cuf_id: 20,
            cuf_value_id: 201,
          }),
        ])
      );
    });
  });
});
