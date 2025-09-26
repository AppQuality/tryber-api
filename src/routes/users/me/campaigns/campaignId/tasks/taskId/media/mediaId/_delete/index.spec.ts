import app from "@src/app";
import request from "supertest";
import { tryber } from "@src/features/database";
import deleteFromS3 from "@src/features/deleteFromS3";

jest.mock("@src/features/deleteFromS3");

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
describe("DELETE users/me/campaigns/:cId/tasks/:tId/media/:mId", () => {
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
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("Should return 403 if user is not authenticated", async () => {
    const response = await request(app).delete(
      "/users/me/campaigns/1/tasks/10/media/1"
    );
    expect(response.status).toBe(403);
  });
  it("Should return 404 if campaign does not exists", async () => {
    const response = await request(app)
      .delete("/users/me/campaigns/100/tasks/10/media/1")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(404);
  });

  describe("As tester NOT selected", () => {
    it("Should return 404 ", async () => {
      const response = await request(app)
        .delete("/users/me/campaigns/1/tasks/10/media/1")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(404);
      expect(response.body).toMatchObject(
        expect.objectContaining({ message: "Campaign not found" })
      );
    });
  });
  describe("As tester selected", () => {
    beforeEach(async () => {
      await tryber.tables.WpCrowdAppqHasCandidate.do().insert({
        campaign_id: 1,
        accepted: 1,
        user_id: 1,
      });
    });
    afterEach(async () => {
      await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
    });

    describe("Tasks not present", () => {
      it("Should return 404", async () => {
        const response = await request(app)
          .delete("/users/me/campaigns/1/tasks/9999/media/10")
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(404);
        expect(response.body).toMatchObject(
          expect.objectContaining({ message: "Media not found" })
        );
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
            allow_media: 1,
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
            id: 15,
            campaign_id: 1,
            title: "Task 15",
            content: "Content 15",
            is_required: 0,
            allow_media: 0,
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
            campaign_task_id: 1,
            filename: "media44",
            location: "https://www.example.com/media44",
            tester_id: 2,
          },
          {
            id: 55,
            user_task_id: 15,
            campaign_task_id: 11,
            filename: "media55-uploaded-by-tester2",
            location: "https://www.example.com/media55",
            tester_id: 1,
          },
        ]);
      });
      afterEach(async () => {
        await tryber.tables.WpAppqCampaignTask.do().delete();
        await tryber.tables.WpAppqUserTask.do().delete();
        await tryber.tables.WpAppqUserTaskMedia.do().delete();
      });

      it("Should return 200", async () => {
        const response = await request(app)
          .delete("/users/me/campaigns/1/tasks/10/media/10")
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(200);
      });
      it("Should return error if try to get media of tasks of other testers", async () => {
        const response = await request(app)
          .delete("/users/me/campaigns/1/tasks/15/media/55")
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(404);
        expect(response.body).toMatchObject(
          expect.objectContaining({ message: "Media not found" })
        );
      });
      it("Should not call deleteFromS3 on media not found", async () => {
        const response = await request(app)
          .delete("/users/me/campaigns/1/tasks/15/media/55")
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(404);

        expect(deleteFromS3).toBeCalledTimes(0);
      });
      it("Should call deleteFromS3 on success", async () => {
        const response = await request(app)
          .delete("/users/me/campaigns/1/tasks/10/media/10")
          .set("Authorization", "Bearer tester");
        expect(deleteFromS3).toBeCalledTimes(1);
        expect(response.status).toBe(200);
      });
      it("Should delete media from database", async () => {
        const before = await tryber.tables.WpAppqUserTaskMedia.do()
          .select()
          .where("id", 20);
        expect(before.length).toBe(1);
        const response = await request(app)
          .delete("/users/me/campaigns/1/tasks/10/media/20")
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(200);
        const after = await tryber.tables.WpAppqUserTaskMedia.do()
          .select()
          .where("id", 20);
        expect(after.length).toBe(0);
      });
    });
  });
});
