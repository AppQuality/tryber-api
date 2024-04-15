import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const baseRequest = {
  project: 10,
  testType: 10,
  title: {
    customer: "Campaign Title for Customer",
    tester: "Campaign Title for Tester",
  },
  startDate: "2019-08-24T14:15:22Z",
  deviceList: [1],
};

describe("Route POST /dossiers", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqCustomer.do().insert({
      id: 1,
      company: "Test Company",
      pm_id: 1,
    });
    await tryber.tables.WpAppqProject.do().insert([
      {
        id: 10,
        display_name: "Test Project",
        customer_id: 1,
        edited_by: 1,
      },
      {
        id: 11,
        display_name: "Test Project 11",
        customer_id: 1,
        edited_by: 1,
      },
    ]);

    await tryber.tables.WpAppqCampaignType.do().insert([
      {
        id: 10,
        name: "Test Type",
        description: "Test Description",
        category_id: 1,
      },
      {
        id: 11,
        name: "Test Type",
        description: "Test Description",
        category_id: 1,
      },
    ]);

    await tryber.tables.WpAppqEvdPlatform.do().insert([
      {
        id: 1,
        name: "Test Type",
        form_factor: 0,
        architecture: 1,
      },
      {
        id: 2,
        name: "Test Type",
        form_factor: 1,
        architecture: 1,
      },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.WpAppqCustomer.do().delete();
    await tryber.tables.WpAppqProject.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
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
      close_date: "2019-08-25T14:15:22Z",
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
  });

  it("Should update the campaign to be linked to the specified project", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, project: 11 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("project_id", 11);
  });

  it("Should updte the campaign to be linked to the specified test type", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, testType: 11 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("campaign_type_id", 11);
  });

  it("Should update the campaign with the specified title", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        title: { ...baseRequest.title, tester: "new title" },
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("title", "new title");
  });

  it("Should update the campaign with the specified customer title", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        title: { ...baseRequest.title, customer: "new title" },
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("customer_title", "new title");
  });

  it("Should update the campaign with the specified start date", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        startDate: "2021-08-24T14:15:22Z",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("start_date", "2021-08-24T14:15:22Z");
  });

  it("Should update the campaign with the specified end date ", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        endDate: "2021-08-20T14:15:22Z",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("end_date", "2021-08-20T14:15:22Z");
  });

  it("Should update the campaign with the specified close date ", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        closeDate: "2021-08-20T14:15:22Z",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("close_date", "2021-08-20T14:15:22Z");
  });

  it("Should leave the end date of the campaign unedited if left unspecified", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        startDate: "2021-08-20T14:15:22Z",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("end_date", "2019-08-24T14:15:22Z");
  });

  it("Should leave the close date of the campaign unedited if left unspecified", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({
        ...baseRequest,
        startDate: "2021-08-20T14:15:22Z",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("close_date", "2019-08-25T14:15:22Z");
  });

  it("Should update the campaign with current user as pm_id", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send(baseRequest);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("pm_id", 1);
  });

  it("Should update campaign with the specified device list", async () => {
    const response = await request(app)
      .put("/dossiers/1")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, deviceList: [1, 2] });

    expect(response.status).toBe(200);

    const id = response.body.id;

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where({ id })
      .first();

    expect(campaign).toHaveProperty("os", "1,2");
    expect(campaign).toHaveProperty("form_factor", "0,1");
  });

  describe("Role handling", () => {
    beforeAll(async () => {
      await tryber.tables.WpAppqEvdProfile.do().insert({
        id: 2,
        wp_user_id: 2,
        name: "Test User",
        surname: "Test Surname",
        education_id: 1,
        employment_id: 1,
        email: "",
      });

      await tryber.tables.CustomRoles.do().insert([
        {
          id: 1,
          name: "Test Role",
          olp: '["appq_bugs"]',
        },
        {
          id: 2,
          name: "Another Role",
          olp: '["appq_bugs_2"]',
        },
      ]);
    });
    afterAll(async () => {
      await tryber.tables.WpAppqEvdProfile.do().delete();
      await tryber.tables.CustomRoles.do().delete();
      await tryber.tables.WpAppqEvdProfile.do().delete();
    });
    afterEach(async () => {
      await tryber.tables.CampaignCustomRoles.do().delete();
      await tryber.tables.WpAppqOlpPermissions.do().delete();
    });
    describe("When campaign has no roles", () => {
      it("Should link the roles to the campaign", async () => {
        const response = await request(app)
          .put("/dossiers/1")
          .set("authorization", "Bearer admin")
          .send({ ...baseRequest, roles: [{ role: 1, user: 1 }] });

        const id = response.body.id;

        const roles = await tryber.tables.CampaignCustomRoles.do()
          .select()
          .where({ campaign_id: id });
        expect(roles).toHaveLength(1);
        expect(roles[0]).toHaveProperty("custom_role_id", 1);
        expect(roles[0]).toHaveProperty("tester_id", 1);
      });

      it("Should set the olp roles to the campaign", async () => {
        const response = await request(app)
          .put("/dossiers/1")
          .set("authorization", "Bearer admin")
          .send({ ...baseRequest, roles: [{ role: 1, user: 2 }] });

        const olps = await tryber.tables.WpAppqOlpPermissions.do()
          .select()
          .where({ main_id: 1 });
        expect(olps).toHaveLength(1);
        expect(olps[0]).toHaveProperty("type", "appq_bugs");
        expect(olps[0]).toHaveProperty("main_type", "campaign");
        expect(olps[0]).toHaveProperty("wp_user_id", 2);
      });
    });

    describe("When campaign has roles", () => {
      beforeEach(async () => {
        await tryber.tables.CampaignCustomRoles.do().insert([
          {
            campaign_id: 1,
            custom_role_id: 1,
            tester_id: 2,
          },
        ]);
        await tryber.tables.WpAppqOlpPermissions.do().insert([
          {
            main_id: 1,
            main_type: "campaign",
            type: "appq_bugs",
            wp_user_id: 2,
          },
        ]);
      });

      afterEach(async () => {
        await tryber.tables.CampaignCustomRoles.do().delete();
        await tryber.tables.WpAppqOlpPermissions.do().delete();
      });
      it("Should link the roles to the campaign", async () => {
        const response = await request(app)
          .put("/dossiers/1")
          .set("authorization", "Bearer admin")
          .send({ ...baseRequest, roles: [{ role: 2, user: 2 }] });

        const id = response.body.id;

        const roles = await tryber.tables.CampaignCustomRoles.do()
          .select()
          .where({ campaign_id: id });
        expect(roles).toHaveLength(1);
        expect(roles[0]).toHaveProperty("custom_role_id", 2);
        expect(roles[0]).toHaveProperty("tester_id", 2);
      });

      it("Should set the olp roles to the campaign", async () => {
        const response = await request(app)
          .put("/dossiers/1")
          .set("authorization", "Bearer admin")
          .send({ ...baseRequest, roles: [{ role: 2, user: 2 }] });

        const olps = await tryber.tables.WpAppqOlpPermissions.do()
          .select()
          .where({ main_id: 1 });
        expect(olps).toHaveLength(1);
        expect(olps[0]).toHaveProperty("type", "appq_bugs_2");
        expect(olps[0]).toHaveProperty("main_type", "campaign");
        expect(olps[0]).toHaveProperty("wp_user_id", 2);
      });
    });
  });
});
