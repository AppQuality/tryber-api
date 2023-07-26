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
const requestBody = {
  insights: [],
  sentiments: [],
};
const singleInsight = {
  title: "Insight Title",
  description: "Insight Description",
  severityId: 1,
  order: 2,
  clusterIds: "all",
  videoPart: [],
};

describe("PATCH /campaigns/{campaignId}/ux - CASE: publish first time a draft", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 99 },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
  });
  afterEach(async () => {
    await tryber.tables.UxCampaignInsights.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
  });

  it("should return 200", async () => {
    const response = await request(app)
      .patch("/campaigns/99/ux")
      .send(requestBody)
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should insert a new insight", async () => {
    const response = await request(app)
      .patch("/campaigns/99/ux")
      .send({
        ...requestBody,
        insights: [singleInsight],
      })
      .set("Authorization", "Bearer admin");
    const insighData = await tryber.tables.UxCampaignInsights.do()
      .select()
      .first();
    expect(insighData).toBeDefined();
    expect(response.status).toBe(200);
  });

  it("Should insert a new insight with title", async () => {
    await request(app)
      .patch("/campaigns/99/ux")
      .send({
        ...requestBody,
        insights: [singleInsight],
      })
      .set("Authorization", "Bearer admin");
    const insights = await tryber.tables.UxCampaignInsights.do().select(
      "title"
    );
    expect(insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Insight Title",
        }),
      ])
    );
  });

  it("Should insert a new insight with description", async () => {
    await request(app)
      .patch("/campaigns/99/ux")
      .send({
        ...requestBody,
        insights: [singleInsight],
      })
      .set("Authorization", "Bearer admin");
    const insights = await tryber.tables.UxCampaignInsights.do().select(
      "description"
    );
    expect(insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          description: "Insight Description",
        }),
      ])
    );
  });

  it("Should insert a new insight with severityId", async () => {
    await request(app)
      .patch("/campaigns/99/ux")
      .send({
        ...requestBody,
        insights: [singleInsight],
      })
      .set("Authorization", "Bearer admin");
    const insights = await tryber.tables.UxCampaignInsights.do().select(
      "severity_id"
    );
    expect(insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity_id: 1,
        }),
      ])
    );
  });

  it("Should insert a new insight with order", async () => {
    await request(app)
      .patch("/campaigns/99/ux")
      .send({
        ...requestBody,
        insights: [singleInsight],
      })
      .set("Authorization", "Bearer admin");
    const insights = await tryber.tables.UxCampaignInsights.do().select(
      "order"
    );
    expect(insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          order: 2,
        }),
      ])
    );
  });

  it("Should insert a new insight with clusterIds all", async () => {
    await request(app)
      .patch("/campaigns/99/ux")
      .send({
        ...requestBody,
        insights: [singleInsight],
      })
      .set("Authorization", "Bearer admin");
    const insights = await tryber.tables.UxCampaignInsights.do().select(
      "cluster_ids"
    );
    expect(insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cluster_ids: "0",
        }),
      ])
    );
  });

  it("Should insert a new insight with 2 clusterIds", async () => {
    await request(app)
      .patch("/campaigns/99/ux")
      .send({
        ...requestBody,
        insights: [{ ...singleInsight, clusterIds: [3, 5] }],
      })
      .set("Authorization", "Bearer admin");
    const insights = await tryber.tables.UxCampaignInsights.do().select(
      "cluster_ids"
    );
    expect(insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cluster_ids: "3,5",
        }),
      ])
    );
  });

  it("Should insert the first version as published", async () => {
    await request(app)
      .patch("/campaigns/99/ux")
      .send({
        ...requestBody,
        insights: [singleInsight],
      })
      .set("Authorization", "Bearer admin");
    const uxData = await tryber.tables.UxCampaignData.do().select();
    console.log(uxData);
    expect(uxData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          campaign_id: 99,
          version: 1,
          published: 1,
        }),
      ])
    );
  });
});
