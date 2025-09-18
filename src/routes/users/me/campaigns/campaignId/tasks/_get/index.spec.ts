import app from "@src/app";
import request from "supertest";
import { tryber } from "@src/features/database";

const campaign = {
  start_date: "2025-09-17",
  platform_id: 1,
  // new date is 5 days in the future
  end_date: "2025-09-29",
  page_version: "v1",
  title: `Campaign`,
  customer_title: `Campaign Customer Title`,
  page_preview_id: 1234,
  page_manual_id: 1234,
  customer_id: 1,
  pm_id: 11111,
  project_id: 1,
  campaign_type_id: 1,
};
const task = {
  jf_code: "jf_code",
  jf_text: "jf_text",
  simple_title: "simple_title",
  info: "info",
  prefix: "prefix",
};
describe("GET users/me/campaigns/:cId/tasks", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqCampaignType.do().insert([
      {
        id: 1,
        name: "Campaign Type 1",
        category_id: 1,
      },
      {
        id: 2,
        name: "Campaign Type 2",
        category_id: 1,
      },
    ]);
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        id: 1,
        wp_user_id: 1,
        name: "John",
        surname: "Doe",
        email: "john.doe@example.com",
        employment_id: 1,
        education_id: 1,
      },
    ]);
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        ...campaign,
        id: 1,
        page_version: "v2",
        is_public: 4,
      }, // 4 = target group
    ]);
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        ...campaign,
        id: 2,
        page_version: "v1",
        is_public: 1,
        campaign_type_id: 2,
        campaign_pts: 2050,
      }, // 1 = public
    ]);
    await tryber.tables.CampaignDossierData.do().insert([
      {
        id: 1,
        campaign_id: 1,
        link: "http://example.com/dossier1",
        created_by: 11111,
        updated_by: 11111,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
    await tryber.tables.CampaignDossierData.do().delete();
  });

  it("Should return 403 if user is not authenticated", async () => {
    const response = await request(app).get("/users/me/campaigns/1/tasks");
    expect(response.status).toBe(403);
  });
  it("Should return 404 if campaign does not exists", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/100/tasks")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(404);
  });

  describe("As admin", () => {
    it("Should return 200 if campaign is V2", async () => {
      const response = await request(app)
        .get("/users/me/campaigns/1/tasks")
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(200);
    });
  });
  describe("As tester NOT in target - targetGroup", () => {
    beforeEach(async () => {
      await tryber.tables.CampaignDossierDataAge.do().insert({
        campaign_dossier_data_id: 1,
        min: 18,
        max: 20,
      });
    });
    afterEach(async () => {
      await tryber.tables.CampaignDossierDataAge.do().delete();
    });
    it("Should return 404 ", async () => {
      const response = await request(app)
        .get("/users/me/campaigns/1/tasks")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(404);
      expect(response.body).toMatchObject(
        expect.objectContaining({ message: "Campaign not found" })
      );
    });
  });
  describe("As tester in target - targetGroup", () => {
    beforeEach(async () => {
      await tryber.tables.CampaignDossierDataAge.do().insert({
        campaign_dossier_data_id: 1,
        min: 50,
        max: 70,
      });
    });
    afterEach(async () => {
      await tryber.tables.CampaignDossierDataAge.do().delete();
    });

    describe("Tasks not present", () => {
      it("Should return 200", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/tasks")
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(200);
      });
      it("Should return empty array if there are no tasks", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/tasks")
          .set("Authorization", "Bearer tester");
        expect(response.body).toMatchObject([]);
      });
    });

    describe("Tasks data present", () => {
      beforeEach(async () => {
        await tryber.tables.WpAppqCampaignTask.do().insert([
          {
            ...task,
            id: 10,
            campaign_id: 1,
            title: "Task 1",
            content: "Content 1",
            is_required: 1,
          },
          {
            ...task,
            id: 11,
            campaign_id: 1,
            title: "Task 2",
            content: "Content 2",
            is_required: 0,
          },
          {
            ...task,
            id: 12,
            campaign_id: 1,
            title: "Task 3",
            content: "Content 3",
            is_required: 1,
          },
          {
            ...task,
            id: 13,
            campaign_id: 2, // task for another campaign
            title: "Task 1",
            content: "Content 4",
            is_required: 1,
          },
          {
            ...task,
            id: 14,
            campaign_id: 1,
            title: "Task 4 without user task",
            content: "Content 4",
            is_required: 1,
          },
          {
            ...task, // task of another tester
            id: 15,
            campaign_id: 1,
            title: "Task 5 - other tester",
            content: "Content 5",
            is_required: 1,
          },
        ]);
        await tryber.tables.WpAppqUserTask.do().insert([
          { id: 1, tester_id: 1, task_id: 10, is_completed: 1 },
          { id: 2, tester_id: 1, task_id: 11, is_completed: 1 },
          { id: 3, tester_id: 1, task_id: 12, is_completed: 0 },
          { id: 4, tester_id: 1, task_id: 13, is_completed: 1 },
          { id: 5, tester_id: 2, task_id: 15, is_completed: 1 },
        ]);
      });
      afterEach(async () => {
        await tryber.tables.WpAppqCampaignTask.do().delete();
        await tryber.tables.WpAppqUserTask.do().delete();
      });

      it("Should return 200", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/tasks")
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(200);
      });
      it("Should not return tasks of other testers", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/tasks")
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(4);
        expect(response.body).toMatchObject(
          expect.not.arrayContaining([
            expect.objectContaining({
              id: 15,
              name: "Task 5 - other tester",
              is_required: 1,
              content: "Content 5",
              status: "completed",
            }),
          ])
        );
      });
      it("Should return array of tasks data", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/tasks")
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(4);
        expect(response.body).toMatchObject(
          expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(Number),
              name: expect.any(String),
              is_required: expect.any(Number),
              content: expect.any(String),
              status: expect.stringMatching(/^(completed|pending)$/),
            }),
          ])
        );
      });
      it("Should return tasks with correct data", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/tasks")
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(200);
        expect(response.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: 10,
              name: "Task 1",
              is_required: 1,
              content: "Content 1",
              status: "completed",
            }),
            expect.objectContaining({
              id: 11,
              name: "Task 2",
              is_required: 0,
              content: "Content 2",
              status: "completed",
            }),
            expect.objectContaining({
              id: 12,
              name: "Task 3",
              is_required: 1,
              content: "Content 3",
              status: "pending",
            }),
            expect.objectContaining({
              id: 14,
              name: "Task 4 without user task",
              is_required: 1,
              content: "Content 4",
              status: "pending",
            }),
          ])
        );
      });
    });
  });
});
