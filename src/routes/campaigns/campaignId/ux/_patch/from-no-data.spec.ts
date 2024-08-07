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

describe("PATCH /campaigns/{campaignId}/ux - if no data insert ux data", () => {
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
    await tryber.tables.WpAppqUsecaseCluster.do().insert([
      {
        id: 1,
        title: "Cluster 1",
        subtitle: "Subtitle 1",
        campaign_id: 1,
      },
      {
        id: 2,
        title: "Cluster 2",
        subtitle: "Subtitle 2",
        campaign_id: 2,
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
    await tryber.tables.UxCampaignQuestions.do().delete();
    await tryber.tables.UxCampaignSentiments.do().delete();
    await tryber.tables.WpAppqUsecaseCluster.do().delete();
  });

  it("Should insert data unpublished", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        sentiments: [],
        questions: [],
        methodology,
      });
    const data = await tryber.tables.UxCampaignData.do().select(
      "published",
      "campaign_id"
    );
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual(
      expect.objectContaining({
        published: 0,
        campaign_id: 1,
      })
    );
  });
  it("Should insert data as version 1", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        sentiments: [],
        questions: [],
        methodology,
      });
    const data = await tryber.tables.UxCampaignData.do().select(
      "published",
      "campaign_id",
      "version"
    );
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual(
      expect.objectContaining({
        published: 0,
        campaign_id: 1,
        version: 1,
      })
    );
  });

  it("Should insert a question", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
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
      })
    );
  });

  it("Should insert a sentiment", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        sentiments: [{ value: 5, clusterId: 1, comment: "My comment" }],
        questions: [],
        methodology,
      });
    const data = await tryber.tables.UxCampaignSentiments.do()
      .select()
      .where({ campaign_id: 1 });
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual(
      expect.objectContaining({
        cluster_id: 1,
        value: 5,
        comment: "My comment",
        campaign_id: 1,
      })
    );
  });

  it("Should insert methodology type", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        sentiments: [],
        questions: [],
        methodology,
      });

    const data = await tryber.tables.UxCampaignData.do()
      .select("methodology_type", "version", "published")
      .first();
    expect(data?.methodology_type).toBeDefined();
    expect(data?.methodology_type).toEqual(methodology.type);
  });

  it("Should insert methodology description", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        sentiments: [],
        questions: [],

        methodology,
      });
    const data = await tryber.tables.UxCampaignData.do()
      .select("methodology_description", "version", "published")
      .first();
    expect(data?.methodology_description).toBeDefined();
    expect(data?.methodology_description).toEqual(methodology.description);
  });

  it("Should insert goal", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        sentiments: [],
        questions: [],

        methodology,
      });
    const data = await tryber.tables.UxCampaignData.do().select("goal").first();
    expect(data?.goal).toBeDefined();
    expect(data?.goal).toEqual("Test Goal");
  });

  it("Should insert users", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 6,
        sentiments: [],
        questions: [],
        methodology,
      });
    const data = await tryber.tables.UxCampaignData.do()
      .select("users")
      .first();
    expect(data?.users).toBeDefined();
    expect(data?.users).toEqual(6);
  });
});
