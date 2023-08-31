import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

jest.mock("@src/features/checkUrl", () => ({
  checkUrl: jest.fn().mockImplementation(() => true),
}));
const campaign = {
  title: "Test Campaign",
  platform_id: 1,
  start_date: "2021-01-01",
  end_date: "2021-01-01",
  pm_id: 1,
  page_manual_id: 1,
  page_preview_id: 1,
  customer_id: 1,
  project_id: 1,
  customer_title: "Test Customer",
};

const methodology = {
  type: "qualitative",
  description: "Methodology Description",
};

describe("PATCH /campaigns/{campaignId}/ux - from empty", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([{ ...campaign, id: 1 }]);
    await tryber.tables.WpAppqUserTaskMedia.do().insert([
      {
        id: 1,
        campaign_task_id: 1,
        user_task_id: 1,
        tester_id: 1,
        location:
          "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.WpAppqUserTaskMedia.do().delete();
  });

  afterEach(async () => {
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.UxCampaignInsights.do().delete();
    await tryber.tables.UxCampaignVideoParts.do().delete();
    await tryber.tables.UxCampaignQuestions.do().delete();
  });

  it("Should insert data as draft", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        insights: [
          {
            title: "My insight",
            description: "My description",
            severityId: 1,
            order: 0,
            clusterIds: "all",
            videoParts: [],
          },
        ],
        sentiments: [],
        questions: [],
        methodology,
      });
    const data = await tryber.tables.UxCampaignData.do().select(
      "version",
      "published",
      "campaign_id"
    );
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual(
      expect.objectContaining({
        version: 1,
        published: 0,
        campaign_id: 1,
      })
    );
  });

  it("Should insert insight as draft", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        insights: [
          {
            title: "My insight",
            description: "My description",
            severityId: 1,
            order: 0,
            clusterIds: "all",
            videoParts: [],
          },
        ],
        sentiments: [],
        questions: [],
        methodology,
      });
    const data = await tryber.tables.UxCampaignInsights.do().select();
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual(
      expect.objectContaining({
        cluster_ids: "0",
        description: "My description",
        order: 0,
        severity_id: 1,
        title: "My insight",
      })
    );
  });
  it("Should insert question as draft", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        insights: [],
        sentiments: [],
        questions: [{ name: "Is there life on Mars?" }],
        methodology,
      });
    const data = await tryber.tables.UxCampaignQuestions.do()
      .select()
      .where({ campaign_id: 1 });
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual(
      expect.objectContaining({
        question: "Is there life on Mars?",
        version: 1,
      })
    );
  });

  it("Should insert insight videopart as draft", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        insights: [
          {
            title: "My insight",
            description: "My description",
            severityId: 1,
            order: 0,
            clusterIds: "all",
            videoParts: [
              {
                start: 0,
                end: 10,
                mediaId: 1,
                description: "My video",
                order: 0,
              },
            ],
          },
        ],
        sentiments: [],
        questions: [],
        methodology,
      });

    const data = await tryber.tables.UxCampaignInsights.do().select();
    expect(data).toHaveLength(1);
    const insightId = data[0].id;
    const videoParts = await tryber.tables.UxCampaignVideoParts.do().select();
    expect(videoParts).toHaveLength(1);
    expect(videoParts[0]).toEqual(
      expect.objectContaining({
        start: 0,
        end: 10,
        media_id: 1,
        description: "My video",
        order: 0,
        insight_id: insightId,
      })
    );
  });

  it("Should insert methodology type as draft", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        insights: [],
        sentiments: [],
        questions: [],
        methodology,
      });

    const data = await tryber.tables.UxCampaignData.do()
      .select("methodology_type", "version", "published")
      .first();
    expect(data?.methodology_type).toBeDefined();
    expect(data?.methodology_type).toEqual(methodology.type);
    expect(data?.published).toEqual(0);
    expect(data?.version).toEqual(1);
  });

  it("Should insert methodology description as draft", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        insights: [],
        sentiments: [],
        questions: [],

        methodology,
      });
    const data = await tryber.tables.UxCampaignData.do()
      .select("methodology_description", "version", "published")
      .first();
    expect(data?.methodology_description).toBeDefined();
    expect(data?.methodology_description).toEqual(methodology.description);
    expect(data?.published).toEqual(0);
    expect(data?.version).toEqual(1);
  });

  it("Should insert goal as draft", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        insights: [],
        sentiments: [],
        questions: [],

        methodology,
      });
    const data = await tryber.tables.UxCampaignData.do()
      .select("goal", "version", "published")
      .first();
    expect(data?.goal).toBeDefined();
    expect(data?.goal).toEqual("Test Goal");
    expect(data?.published).toEqual(0);
    expect(data?.version).toEqual(1);
  });

  it("Should insert users number as draft", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 6,
        insights: [],
        sentiments: [],
        questions: [],

        methodology,
      });
    const data = await tryber.tables.UxCampaignData.do()
      .select("users", "version", "published")
      .first();
    expect(data?.users).toBeDefined();
    expect(data?.users).toEqual(6);
    expect(data?.published).toEqual(0);
    expect(data?.version).toEqual(1);
  });

  it("Should return 400 if inserting video part with invalid media id", async () => {
    const response = await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        insights: [
          {
            title: "My insight",
            description: "My description",
            severityId: 1,
            order: 0,
            clusterIds: "all",
            videoParts: [
              {
                start: 0,
                end: 10,
                mediaId: 99,
                description: "My video",
                order: 0,
              },
            ],
          },
        ],
        sentiments: [],
        questions: [],

        methodology,
      });

    expect(response.status).toBe(400);
  });

  it("Should return 400 on publish", async () => {
    const response = await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        status: "publish",
      });
    expect(response.status).toBe(400);
  });
});
