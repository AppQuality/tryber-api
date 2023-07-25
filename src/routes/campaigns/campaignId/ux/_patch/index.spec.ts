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
const singleVideoPart = {
  start: 6,
  end: 9,
  mediaId: 666,
  description: "Videopart Description",
  order: 9,
};

describe("PATCH /campaigns/{campaignId}/ux - permissions and loggin statuses", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([{ ...campaign, id: 1 }]);
    await tryber.tables.UxCampaignData.do().insert({
      campaign_id: 1,
      version: 1,
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
  });
  it("should return 403 if not logged in", async () => {
    const response = await request(app).patch("/campaigns/1/ux");
    expect(response.status).toBe(403);
  });
  it("Should return 403 if logged in as not admin user", async () => {
    const response = await request(app)
      .patch("/campaigns/1/ux")
      .send(requestBody)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 200 if logged as admin user", async () => {
    const response = await request(app)
      .patch("/campaigns/1/ux")
      .send(requestBody)
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should return 403 if campaign does not exists", async () => {
    const response = await request(app)
      .patch("/campaigns/999/ux")
      .send(requestBody)
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(403);
  });
});

describe("PATCH /campaigns/{campaignId}/ux - CASE: publish first time a draft", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 99 },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.UxCampaignInsights.do().delete();
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
});
