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

const metodology = {
  name: "Metodology Name",
  type: "qualitative",
  description: "Metodology Description",
};

describe("PATCH /campaigns/{campaignId}/ux - from draft", () => {
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
    await tryber.tables.UxCampaignData.do().insert({
      campaign_id: 1,
      version: 1,
      published: 0,
    });

    await tryber.tables.UxCampaignInsights.do().insert({
      id: 1,
      campaign_id: 1,
      version: 1,
      title: "Draft insight",
      description: "Draft description",
      severity_id: 1,
      cluster_ids: "1",
    });

    await tryber.tables.UxCampaignVideoParts.do().insert({
      id: 1,
      insight_id: 1,
      start: 0,
      end: 10,
      description: "My video",
      media_id: 1,
    });
  });
  afterEach(async () => {
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.UxCampaignInsights.do().delete();
    await tryber.tables.UxCampaignVideoParts.do().delete();
  });

  it("Should not insert a new draft", async () => {
    const response = await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        insights: [],
        sentiments: [],
        metodology,
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

  it("Should remove a insights as draft if the insights are not sent ", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        insights: [],
        sentiments: [],
        metodology,
      });

    const insights = await tryber.tables.UxCampaignInsights.do().select();
    expect(insights).toHaveLength(0);
  });

  it("Should thrown an error if trying to edit an insight that not exists", async () => {
    const response = await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        insights: [
          {
            id: 1000,
            title: "Draft invalid insight",
            description: "Draft invalid description",
            severityId: 2,
            clusterIds: "all",
            order: 0,
            videoParts: [],
          },
        ],
        sentiments: [],
        metodology,
      });

    const insights = await tryber.tables.UxCampaignInsights.do().select();
    expect(insights).toHaveLength(1);
    expect(insights[0]).toEqual(
      expect.objectContaining({
        campaign_id: 1,
        cluster_ids: "1",
        description: "Draft description",
        id: 1,
        order: 0,
        severity_id: 1,
        title: "Draft insight",
        version: 1,
      })
    );
  });

  it("Should insert a insights as draft if an item without id is sent", async () => {
    const response = await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        insights: [
          {
            id: 1,
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
        metodology,
      });

    const insights = await tryber.tables.UxCampaignInsights.do().select();
    expect(insights).toHaveLength(2);
    expect(insights[0]).toEqual(
      expect.objectContaining({
        campaign_id: 1,
        cluster_ids: "1",
        description: "Draft description",
        order: 0,
        severity_id: 1,
        title: "Draft insight",
        version: 1,
      })
    );
    expect(insights[1]).toEqual(
      expect.objectContaining({
        campaign_id: 1,
        cluster_ids: "0",
        description: "New description",
        order: 1,
        severity_id: 2,
        title: "New insight",
        version: 1,
      })
    );
  });

  it("Should update a insights as draft if an item with id is sent", async () => {
    const response = await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        insights: [
          {
            id: 1,
            title: "Updated insight",
            description: "Updated description",
            severityId: 2,
            clusterIds: "all",
            order: 1,
            videoParts: [],
          },
        ],
        sentiments: [],
        metodology,
      });

    const insights = await tryber.tables.UxCampaignInsights.do().select();
    expect(insights).toHaveLength(1);
    expect(insights[0]).toEqual(
      expect.objectContaining({
        campaign_id: 1,
        cluster_ids: "0",
        description: "Updated description",
        order: 1,
        severity_id: 2,
        title: "Updated insight",
        version: 1,
      })
    );
  });

  it("Should create a new version on publish", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        status: "publish",
      });

    const data = await tryber.tables.UxCampaignData.do().select();
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual(
      expect.objectContaining({
        campaign_id: 1,
        version: 1,
        published: 1,
      })
    );
    expect(data[1]).toEqual(
      expect.objectContaining({
        campaign_id: 1,
        version: 2,
        published: 0,
      })
    );
  });

  it("Should create a new version of insights on publish", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        status: "publish",
      });

    const insights = await tryber.tables.UxCampaignInsights.do().select();
    expect(insights).toHaveLength(2);
    expect(insights[0]).toEqual(
      expect.objectContaining({
        campaign_id: 1,
        version: 1,
        title: "Draft insight",
        description: "Draft description",
        severity_id: 1,
        cluster_ids: "1",
      })
    );
    expect(insights[1]).toEqual(
      expect.objectContaining({
        campaign_id: 1,
        version: 2,
        title: "Draft insight",
        description: "Draft description",
        severity_id: 1,
        cluster_ids: "1",
      })
    );
  });

  it("Should remove insight videopart if empty", async () => {
    const response = await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        insights: [
          {
            id: 1,
            title: "My insight",
            description: "My description",
            severityId: 1,
            order: 0,
            clusterIds: "all",
            videoParts: [],
          },
        ],
        sentiments: [],
        metodology,
      });

    const videoParts = await tryber.tables.UxCampaignVideoParts.do().select();
    expect(videoParts).toHaveLength(0);
  });

  it("Should add insight videopart as draft", async () => {
    const response = await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        insights: [
          {
            id: 1,
            title: "My insight",
            description: "My description",
            severityId: 1,
            order: 0,
            clusterIds: "all",
            videoParts: [
              {
                id: 1,
                start: 0,
                end: 10,
                mediaId: 1,
                description: "My video",
                order: 0,
              },
              {
                start: 10,
                end: 100,
                mediaId: 1,
                description: "My second video",
                order: 1,
              },
            ],
          },
        ],
        sentiments: [],
        metodology,
      });

    const data = await tryber.tables.UxCampaignInsights.do().select();
    expect(data).toHaveLength(1);
    const insightId = data[0].id;
    const videoParts = await tryber.tables.UxCampaignVideoParts.do().select();
    expect(videoParts).toHaveLength(2);
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
    expect(videoParts[1]).toEqual(
      expect.objectContaining({
        start: 10,
        end: 100,
        media_id: 1,
        description: "My second video",
        order: 1,
        insight_id: insightId,
      })
    );
  });

  it("Should update insight videopart as draft", async () => {
    const response = await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        insights: [
          {
            id: 1,
            title: "My insight",
            description: "My description",
            severityId: 1,
            order: 0,
            clusterIds: "all",
            videoParts: [
              {
                id: 1,
                start: 10,
                end: 100,
                mediaId: 1,
                description: "Updated video",
                order: 1,
              },
            ],
          },
        ],
        sentiments: [],
        metodology,
      });

    const data = await tryber.tables.UxCampaignInsights.do().select();
    expect(data).toHaveLength(1);
    const insightId = data[0].id;
    const videoParts = await tryber.tables.UxCampaignVideoParts.do().select();
    expect(videoParts).toHaveLength(1);
    expect(videoParts[0]).toEqual(
      expect.objectContaining({
        start: 10,
        end: 100,
        media_id: 1,
        description: "Updated video",
        order: 1,
        insight_id: insightId,
      })
    );
  });

  it("Should insert new insight with videopart as draft", async () => {
    const response = await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        insights: [
          {
            title: "My new insight",
            description: "My new description",
            severityId: 1,
            order: 0,
            clusterIds: "all",
            videoParts: [
              {
                start: 10,
                end: 100,
                mediaId: 1,
                description: "New video",
                order: 0,
              },
            ],
          },
        ],
        sentiments: [],
        metodology,
      });

    const data = await tryber.tables.UxCampaignInsights.do().select();
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual(
      expect.objectContaining({
        campaign_id: 1,
        cluster_ids: "0",
        description: "My new description",
        order: 0,
        severity_id: 1,
        title: "My new insight",
        version: 1,
      })
    );
    const insightId = data[0].id;
    const videoParts = await tryber.tables.UxCampaignVideoParts.do().select();
    expect(videoParts).toHaveLength(1);
    expect(videoParts[0]).toEqual(
      expect.objectContaining({
        start: 10,
        end: 100,
        media_id: 1,
        description: "New video",
        order: 0,
        insight_id: insightId,
      })
    );
  });

  it("Should create a new version of videoparts on publish", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        status: "publish",
      });

    const publishInsight = await tryber.tables.UxCampaignInsights.do()
      .select()
      .where({
        version: 1,
        campaign_id: 1,
      })
      .first();

    const draftInsight = await tryber.tables.UxCampaignInsights.do()
      .select()
      .where({
        version: 2,
        campaign_id: 1,
      })
      .first();
    expect(publishInsight).toBeDefined();
    expect(draftInsight).toBeDefined();

    if (!publishInsight || !draftInsight) throw new Error("Insight not found");

    const publishVideoParts = await tryber.tables.UxCampaignVideoParts.do()
      .select()
      .where({
        insight_id: publishInsight.id,
      })
      .first();

    const draftVideoPart = await tryber.tables.UxCampaignVideoParts.do()
      .select()
      .where({
        insight_id: draftInsight.id,
      })
      .first();

    expect(publishVideoParts).toBeDefined();
    expect(draftVideoPart).toBeDefined();
  });
});
