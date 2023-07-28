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
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
  });
  beforeEach(async () => {
    await tryber.tables.UxCampaignData.do().insert({
      campaign_id: 1,
      version: 1,
      published: 1,
    });

    await tryber.tables.UxCampaignData.do().insert({
      campaign_id: 1,
      version: 2,
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

    await tryber.tables.UxCampaignInsights.do().insert({
      id: 2,
      campaign_id: 1,
      version: 2,
      title: "Draft insight",
      description: "Draft description",
      severity_id: 1,
      cluster_ids: "1",
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
    const response = await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        insights: [],
        sentiments: [],
      });

    const data = await tryber.tables.UxCampaignInsights.do().select();

    expect(data).toHaveLength(1);
    expect(data[0]).toEqual(
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
  });

  it("Should insert a insights in the draft", async () => {
    const response = await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        insights: [
          {
            id: 2,
            title: "Draft insight",
            description: "Draft description",
            severityId: 1,
            clusterIds: [1],
            order: 0,
            videoPart: [],
          },
          {
            title: "New insight",
            description: "New description",
            severityId: 2,
            clusterIds: "all",
            order: 1,
            videoPart: [],
          },
        ],
        sentiments: [],
      });

    const insights = await tryber.tables.UxCampaignInsights.do().select();
    expect(insights).toHaveLength(3);
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
});
