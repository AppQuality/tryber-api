import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

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

describe("PATCH /campaigns/{campaignId}/ux - from publish", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([{ ...campaign, id: 1 }]);
    await tryber.tables.WpAppqUsecaseCluster.do().insert([
      {
        id: 1,
        title: "Cluster 1",
        subtitle: "Subtitle 1",
        campaign_id: 1,
      },
    ]);
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
  beforeEach(async () => {
    await tryber.tables.UxCampaignData.do().insert([
      {
        campaign_id: 1,
        version: 1,
        published: 1,
        methodology_description: methodology.description,
        methodology_type: methodology.type,
      },
      {
        campaign_id: 1,
        version: 2,
        published: 0,
        methodology_description: methodology.description,
        methodology_type: methodology.type,
      },
    ]);

    await tryber.tables.UxCampaignInsights.do().insert([
      {
        id: 1,
        campaign_id: 1,
        version: 1,
        title: "Publish insight",
        description: "Publish description",
        severity_id: 1,
        cluster_ids: "1",
      },
      {
        id: 2,
        campaign_id: 1,
        version: 2,
        title: "Draft insight",
        description: "Draft description",
        severity_id: 1,
        cluster_ids: "1",
      },
    ]);

    await tryber.tables.UxCampaignVideoParts.do().insert([
      {
        id: 1,
        media_id: 1,
        insight_id: 1,
        start: 0,
        end: 10,
        description: "Publish video part",
      },
      {
        id: 2,
        media_id: 1,
        insight_id: 1,
        start: 0,
        end: 10,
        description: "Draft video part",
      },
    ]);
  });

  afterEach(async () => {
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.UxCampaignInsights.do().delete();
    await tryber.tables.UxCampaignVideoParts.do().delete();
    await tryber.tables.UxCampaignQuestions.do().delete();
  });

  it("Should not insert a new draft", async () => {
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

    const data = await tryber.tables.UxCampaignData.do().select(
      "version",
      "published",
      "campaign_id"
    );
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual(
      expect.objectContaining({
        version: 1,
        published: 1,
        campaign_id: 1,
      })
    );
    expect(data[1]).toEqual(
      expect.objectContaining({
        version: 2,
        published: 0,
        campaign_id: 1,
      })
    );
  });

  it("Should remove insights from the draft", async () => {
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

    const data = await tryber.tables.UxCampaignInsights.do().select();

    expect(data).toHaveLength(1);
    expect(data[0]).toEqual(
      expect.objectContaining({
        campaign_id: 1,
        cluster_ids: "1",
        description: "Publish description",
        order: 0,
        severity_id: 1,
        title: "Publish insight",
        version: 1,
      })
    );
  });

  it("Should update a methodology description in the draft", async () => {
    const draftBefore = await tryber.tables.UxCampaignData.do()
      .select("methodology_description")
      .where({ version: 2, published: 0 })
      .first();
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        insights: [],
        sentiments: [],
        questions: [],
        methodology: { ...methodology, description: "New description" },
      });

    const updatedDraft = await tryber.tables.UxCampaignData.do()
      .select("methodology_description")
      .where({ version: 2, published: 0 })
      .first();
    expect(updatedDraft?.methodology_description).not.toEqual(
      draftBefore?.methodology_description
    );
    expect(updatedDraft?.methodology_description).toEqual("New description");
  });

  it("Should update a methodology type in the draft", async () => {
    const draftBefore = await tryber.tables.UxCampaignData.do()
      .select("methodology_type")
      .where({ version: 2, published: 0 })
      .first();
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        insights: [],
        sentiments: [],
        questions: [],
        methodology: { ...methodology, type: "quantitative" },
      });

    const updatedDraft = await tryber.tables.UxCampaignData.do()
      .select("methodology_type")
      .where({ version: 2, published: 0 })
      .first();
    expect(updatedDraft?.methodology_type).not.toEqual(
      draftBefore?.methodology_type
    );
    expect(updatedDraft?.methodology_type).toEqual("quantitative");
  });

  it("Should update the goal in the draft", async () => {
    const draftBefore = await tryber.tables.UxCampaignData.do()
      .select("goal")
      .where({ version: 2, published: 0 })
      .first();
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "New Test Goal",
        usersNumber: 5,
        insights: [],
        sentiments: [],
        questions: [],
        methodology,
      });

    const updatedDraft = await tryber.tables.UxCampaignData.do()
      .select("goal")
      .where({ version: 2, published: 0 })
      .first();
    expect(updatedDraft?.goal).not.toEqual(draftBefore?.goal);
    expect(updatedDraft?.goal).toEqual("New Test Goal");
  });

  it("Should update the users number in the draft", async () => {
    const draftBefore = await tryber.tables.UxCampaignData.do()
      .select("users")
      .where({ version: 2, published: 0 })
      .first();
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

    const updatedDraft = await tryber.tables.UxCampaignData.do()
      .select("users")
      .where({ version: 2, published: 0 })
      .first();
    expect(updatedDraft?.users).not.toEqual(draftBefore?.users);
    expect(updatedDraft?.users).toEqual(6);
  });

  it("Should insert a insights in the draft", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        insights: [
          {
            id: 2,
            title: "Draft insight",
            description: "Draft description",
            severityId: 1,
            clusterIds: [1],
            order: 0,
            videoParts: [],
          },
          {
            title: "New insight",
            description: "New description",
            severityId: 2,
            clusterIds: "all",
            order: 1,
            videoParts: [],
          },
        ],
        sentiments: [],
        questions: [],
        methodology,
      });

    const insights = await tryber.tables.UxCampaignInsights.do().select();
    expect(insights).toHaveLength(3);
    expect(insights[0]).toEqual(
      expect.objectContaining({
        campaign_id: 1,
        cluster_ids: "1",
        description: "Publish description",
        order: 0,
        severity_id: 1,
        title: "Publish insight",
        version: 1,
      })
    );

    expect(insights[1]).toEqual(
      expect.objectContaining({
        campaign_id: 1,
        cluster_ids: "1",
        description: "Draft description",
        order: 0,
        severity_id: 1,
        title: "Draft insight",
        version: 2,
      })
    );
    expect(insights[2]).toEqual(
      expect.objectContaining({
        campaign_id: 1,
        cluster_ids: "0",
        description: "New description",
        order: 1,
        severity_id: 2,
        title: "New insight",
        version: 2,
      })
    );
  });

  it("Should insert a insights video part in the draft", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        insights: [
          {
            id: 2,
            title: "Draft insight",
            description: "Draft description",
            severityId: 1,
            clusterIds: [1],
            order: 0,
            videoParts: [
              {
                id: 2,
                start: 0,
                end: 10,
                mediaId: 1,
                description: "Draft video part",
                order: 0,
              },
              {
                start: 10,
                end: 100,
                mediaId: 1,
                description: "New video part",
                order: 1,
              },
            ],
          },
          {
            title: "New insight",
            description: "New description",
            severityId: 2,
            clusterIds: "all",
            order: 1,
            videoParts: [],
          },
        ],
        sentiments: [],
        questions: [],
        methodology,
      });

    const videoPart = await tryber.tables.UxCampaignVideoParts.do().select();
    expect(videoPart).toHaveLength(3);
    expect(videoPart[0]).toEqual(
      expect.objectContaining({
        id: 1,
        description: "Publish video part",
      })
    );
    expect(videoPart[1]).toEqual(
      expect.objectContaining({
        id: 2,
        description: "Draft video part",
      })
    );
    expect(videoPart[2]).toEqual(
      expect.objectContaining({
        id: 3,
        description: "New video part",
      })
    );
  });
});
