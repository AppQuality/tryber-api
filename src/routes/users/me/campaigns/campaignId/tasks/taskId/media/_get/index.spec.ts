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
  allow_media: 1,
};
describe("GET users/me/campaigns/:cId/tasks/:tId/media", () => {
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
    const response = await request(app).get(
      "/users/me/campaigns/1/tasks/10/media"
    );
    expect(response.status).toBe(403);
  });
  it("Should return 404 if campaign does not exists", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/100/tasks")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(404);
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
        .get("/users/me/campaigns/1/tasks/10/media")
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
      it("Should return 403", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/tasks/9999/media")
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(403);
      });
    });

    describe("Tasks data present", () => {
      beforeAll(async () => {
        await tryber.tables.WpAppqCampaignTask.do().insert([
          {
            ...task,
            id: 10,
            campaign_id: 1,
            title: "Task 1",
            content: "Content 1",
            is_required: 1,
            allow_media: 1,
          },
          {
            ...task,
            id: 11,
            campaign_id: 1,
            title: "Task 2",
            content: "Content 2",
            is_required: 0,
            allow_media: 0,
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
            allow_media: 0,
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
          {
            id: 123,
            tester_id: 2,
            task_id: 15,
            is_completed: 1,
          },
          { id: 1, tester_id: 1, task_id: 10, is_completed: 1 },
          { id: 2, tester_id: 1, task_id: 11, is_completed: 1 },
        ]);
        await tryber.tables.WpAppqUserTaskMedia.do().insert([
          {
            id: 10,
            user_task_id: 1,
            campaign_task_id: 10,
            filename: "media10",
            location: "https://www.example.com/media10",
            tester_id: 1,
          },
          {
            id: 20,
            user_task_id: 1,
            campaign_task_id: 10,
            filename: "media20",
            location: "https://www.example.com/media20",
            tester_id: 1,
          },
          {
            id: 33,
            user_task_id: 2,
            campaign_task_id: 10,
            filename: "media33",
            location: "https://www.example.com/media33",
            tester_id: 2,
          },
          {
            id: 44,
            user_task_id: 123,
            campaign_task_id: 15,
            filename: "media44",
            location: "https://www.example.com/media44",
            tester_id: 2,
          },
          {
            id: 55,
            user_task_id: 11,
            campaign_task_id: 11,
            filename: "media55-on-task-not-allowed-upload",
            location: "https://www.example.com/media55",
            tester_id: 1,
          },
        ]);
      });
      afterAll(async () => {
        await tryber.tables.WpAppqCampaignTask.do().delete();
        await tryber.tables.WpAppqUserTask.do().delete();
        await tryber.tables.WpAppqUserTaskMedia.do().delete();
      });

      it("Should return 200", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/tasks/10/media")
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(200);
      });
      it("Should return error if try to get media of tasks of other testers", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/tasks/15/media")
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(403);
        expect(response.body).toMatchObject(
          expect.objectContaining({ message: "Task not found" })
        );
      });
      it("Should return array of media data", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/tasks/10/media")
          .set("Authorization", "Bearer tester");
        expect(response.body.items).toHaveLength(2);
        expect(response.body).toMatchObject({
          items: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(Number),
              location: expect.any(String),
              name: expect.any(String),
            }),
          ]),
        });
      });
      it("Should return tasks with correct data", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/tasks/10/media")
          .set("Authorization", "Bearer tester");
        expect(response.body.items).toHaveLength(2);
        expect(response.body).toMatchObject({
          items: expect.arrayContaining([
            expect.objectContaining({
              id: 10,
              location: "https://www.example.com/media10",
              name: "media10",
            }),
            expect.objectContaining({
              id: 20,
              location: "https://www.example.com/media20",
              name: "media20",
            }),
          ]),
        });
      });
      it("Should not contain media uploaded from other tester in the same task", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/tasks/10/media")
          .set("Authorization", "Bearer tester");
        expect(response.body.items).toHaveLength(2);
        expect(response.body).toMatchObject({
          items: expect.not.arrayContaining([
            expect.objectContaining({
              id: 33,
              location: "https://www.example.com/media33",
              name: "media33",
            }),
          ]),
        });
      });
      it("Should return empty array if task not allowed uploaded", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/tasks/11/media")
          .set("Authorization", "Bearer tester");
        expect(response.body).toMatchObject({
          items: expect.not.arrayContaining([
            expect.objectContaining({
              id: 55,
              location: "https://www.example.com/media55",
              name: "media55-on-task-not-allowed-upload",
            }),
          ]),
        });
        expect(response.body.items).toHaveLength(0);
      });
    });
  });
});
