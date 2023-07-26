import app from "@src/app";
import { tryber } from "@src/features/database";
import { response } from "express";
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
const requestBody = {
  status: "draft",
  insights: [],
  sentiments: [],
};
const singleInsight = {
  title: "Insight Title",
  description: "Insight Description",
  severityId: 1,
  order: 2,
  clusterIds: "1,2",
  videoPart: [],
};

describe("PATCH /campaigns/{campaignId}/ux - CASE: save a new version (of ux data) as draft", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 99 },
    ]);
    await tryber.tables.UxCampaignInsights.do().insert({
      id: 1,
      campaign_id: 99,
      version: 1,
      title: "Insight Title",
      description: "Insight Description",
      severity_id: 1,
      cluster_ids: "1,2",
      order: 2,
    });
    await tryber.tables.UxCampaignData.do().insert({
      campaign_id: 99,
      version: 1,
      published: 0,
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignInsights.do().delete();
  });

  it("should return 200", async () => {
    const response = await request(app)
      .patch("/campaigns/99/ux")
      .send(requestBody)
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should update the uxData version as draft", async () => {
    await request(app)
      .patch("/campaigns/99/ux")
      .send({
        ...requestBody,
        insights: [{ ...singleInsight, clusterIds: [8, 9] }],
      })
      .set("Authorization", "Bearer admin");
    const uxData = await tryber.tables.UxCampaignData.do()
      .select()
      .where({ campaign_id: 99 });
    expect(uxData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          campaign_id: 99,
          version: 3,
          published: 0,
        }),
      ])
    );
  });

  it("Should not insert a new uxData version when status is draft", async () => {
    const uxDataPre = await tryber.tables.UxCampaignData.do()
      .select()
      .where({ campaign_id: 99 });
    await request(app)
      .patch("/campaigns/99/ux")
      .send({
        ...requestBody,
        insights: [{ ...singleInsight, clusterIds: [8, 9] }],
      })
      .set("Authorization", "Bearer admin");
    const uxDataPost = await tryber.tables.UxCampaignData.do()
      .select()
      .where({ campaign_id: 99 });
    expect(uxDataPre.length).toEqual(uxDataPost.length);
  });

  it("Should update insight version", async () => {
    const insighPre = await tryber.tables.UxCampaignInsights.do()
      .select()
      .where({ campaign_id: 99, id: 1 })
      .orderBy("version", "desc")
      .first();
    await request(app)
      .patch("/campaigns/99/ux")
      .send({
        ...requestBody,
        insights: [{ ...singleInsight, id: 1, clusterIds: [8, 9] }],
      })
      .set("Authorization", "Bearer admin");
    const insighPost = await tryber.tables.UxCampaignInsights.do()
      .select()
      .where({ campaign_id: 99, id: 1 })
      .orderBy("version", "desc")
      .first();
    if (insighPre?.version)
      expect(insighPost?.version).toBeGreaterThan(insighPre?.version);
  });

  it("Should update title for existing insight", async () => {
    await request(app)
      .patch("/campaigns/99/ux")
      .send({
        ...requestBody,
        insights: [
          {
            ...singleInsight,
            id: 1,
            title: "New Insight Title",
            clusterIds: [8, 9],
          },
        ],
      })
      .set("Authorization", "Bearer admin");
    const insight = await tryber.tables.UxCampaignInsights.do()
      .select("title")
      .where({ campaign_id: 99, id: 1 })
      .first();
    expect(insight).toEqual(
      expect.objectContaining({
        title: "New Insight Title",
      })
    );
  });

  it("Should update description for existing insight", async () => {
    await request(app)
      .patch("/campaigns/99/ux")
      .send({
        ...requestBody,
        insights: [
          {
            ...singleInsight,
            id: 1,
            description: "New Insight Description",
            clusterIds: [8, 9],
          },
        ],
      })
      .set("Authorization", "Bearer admin");
    const insight = await tryber.tables.UxCampaignInsights.do()
      .select("description")
      .where({ campaign_id: 99, id: 1 })
      .first();
    expect(insight).toEqual(
      expect.objectContaining({
        description: "New Insight Description",
      })
    );
  });

  it("Should update severityId for existing insight", async () => {
    await request(app)
      .patch("/campaigns/99/ux")
      .send({
        ...requestBody,
        insights: [
          {
            ...singleInsight,
            id: 1,
            severityId: 7,
            clusterIds: [8, 9],
          },
        ],
      })
      .set("Authorization", "Bearer admin");
    const insight = await tryber.tables.UxCampaignInsights.do()
      .select("severity_id")
      .where({ campaign_id: 99, id: 1 })
      .first();
    expect(insight).toEqual(
      expect.objectContaining({
        severity_id: 7,
      })
    );
  });

  it("Should update order for existing insight", async () => {
    await request(app)
      .patch("/campaigns/99/ux")
      .send({
        ...requestBody,
        insights: [
          {
            ...singleInsight,
            id: 1,
            order: 7,
            clusterIds: [8, 9],
          },
        ],
      })
      .set("Authorization", "Bearer admin");
    const insight = await tryber.tables.UxCampaignInsights.do()
      .select("order")
      .where({ campaign_id: 99, id: 1 })
      .first();
    expect(insight).toEqual(
      expect.objectContaining({
        order: 7,
      })
    );
  });

  it("Should update clusterIds as 3,4 for existing insight", async () => {
    await request(app)
      .patch("/campaigns/99/ux")
      .send({
        ...requestBody,
        insights: [
          {
            ...singleInsight,
            id: 1,
            clusterIds: [3, 4],
          },
        ],
      })
      .set("Authorization", "Bearer admin");
    const insight = await tryber.tables.UxCampaignInsights.do()
      .select("cluster_ids")
      .where({ campaign_id: 99, id: 1 })
      .first();
    expect(insight).toEqual(
      expect.objectContaining({
        cluster_ids: "3,4",
      })
    );
  });

  it("Should update clusterIds as all for existing insight", async () => {
    await request(app)
      .patch("/campaigns/99/ux")
      .send({
        ...requestBody,
        insights: [
          {
            ...singleInsight,
            id: 1,
            clusterIds: "all",
          },
          //{ ...singleInsight, title: "Insight Title 2", clusterIds: [8, 9] },
        ],
      })
      .set("Authorization", "Bearer admin");
    const insight = await tryber.tables.UxCampaignInsights.do()
      .select("cluster_ids")
      .where({ campaign_id: 99, id: 1 })
      .first();
    expect(insight).toEqual(
      expect.objectContaining({
        cluster_ids: "0",
      })
    );
  });

  it("Should add a new insight to existing uxData", async () => {
    await request(app)
      .patch("/campaigns/99/ux")
      .send({
        ...requestBody,
        insights: [
          {
            ...singleInsight,
            id: 1,
            clusterIds: "all",
          },
          { ...singleInsight, title: "Insight Title 2", clusterIds: [8, 9] },
        ],
      })
      .set("Authorization", "Bearer admin");
    const insight = await tryber.tables.UxCampaignInsights.do()
      .select("cluster_ids")
      .where({ campaign_id: 99, id: 2 })
      .first();
    expect(insight).toBeDefined();
    expect(insight).toEqual(
      expect.objectContaining({
        cluster_ids: "1,2",
      })
    );
  });
});
