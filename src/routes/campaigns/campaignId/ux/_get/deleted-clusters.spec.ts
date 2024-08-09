import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const campaign = {
  platform_id: 1,
  pm_id: 1,
  page_preview_id: 1,
  page_manual_id: 1,
  start_date: "2021-01-01",
  end_date: "2021-01-01",
  close_date: "2021-01-01",
  title: "Campaign 1",
  customer_title: "Customer 1",
  customer_id: 1,
  project_id: 1,
  campaign_type_id: 1,
};
describe("GET /campaigns/{campaignId}/ux - deleted clusters", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        ...campaign,
        id: 1,
      },
      {
        ...campaign,
        id: 2,
      },
    ]);
    await tryber.tables.WpAppqCampaignType.do().insert([
      {
        id: 1,
        name: "Usability Test",
        category_id: 1,
      },
    ]);
    await tryber.tables.WpAppqUsecaseCluster.do().insert([
      {
        id: 1,
        campaign_id: 1,
        title: "Cluster 1",
        subtitle: "",
      },
      {
        id: 2,
        campaign_id: 1,
        title: "Cluster 2",
        subtitle: "",
      },
    ]);
    await tryber.tables.UxCampaignInsights.do().insert([
      {
        id: 1,
        campaign_id: 1,
        title: "Finding cluster all",
        description: "Finding description",
        severity_id: 1,
        cluster_ids: "0",
        order: 2,
        enabled: 1,
      },
      {
        id: 2,
        campaign_id: 1,
        title: "Finding cluster 1",
        description: "Finding description",
        severity_id: 2,
        cluster_ids: "1",
        order: 1,
        enabled: 1,
      },
      {
        id: 3,
        campaign_id: 1,
        title: "Finding cluster 1,2",
        description: "Finding description",
        severity_id: 2,
        cluster_ids: "1,2",
        order: 1,
        enabled: 1,
      },
      {
        id: 4,
        campaign_id: 1,
        title: "Finding disabled",
        description: "Finding description",
        severity_id: 3,
        cluster_ids: "0",
        order: 0,
        enabled: 0,
      },
      {
        id: 5,
        campaign_id: 1,
        title: "Finding deleted cluster",
        description: "Insight description",
        severity_id: 3,
        cluster_ids: "3",
        order: 0,
        enabled: 1,
      },
      {
        id: 6,
        campaign_id: 1,
        title: "Finding mixed clusters 1,3 (3 is deleted)",
        description: "Insight description",
        severity_id: 3,
        cluster_ids: "1,3",
        order: 0,
        enabled: 1,
      },
      {
        id: 7,
        campaign_id: 2,
        title: "Finding other cp",
        description: "Insight description",
        severity_id: 3,
        cluster_ids: "0",
        order: 0,
        enabled: 1,
      },
    ]);
    await tryber.tables.UxCampaignSentiments.do().insert([
      {
        campaign_id: 1,
        cluster_id: 1,
        value: 1,
        comment: "Comment 1",
      },
      {
        campaign_id: 1,
        cluster_id: 2,
        value: 5,
        comment: "Comment 2",
      },
      {
        campaign_id: 1,
        cluster_id: 3, //deleted cluster
        value: 4,
        comment: "Comment 3",
      },
    ]);
  });

  describe("Not published", () => {
    beforeAll(async () => {
      await tryber.tables.UxCampaignData.do().insert([
        {
          campaign_id: 1,
          published: 0,
          methodology_description: "Methodology description",
          methodology_type: "qualitative",
          goal: "Goal",
          users: 10,
        },
      ]);
    });
    afterAll(async () => {
      await tryber.tables.UxCampaignData.do().delete();
    });

    it("Should return the sentiments if exist the cluster", async () => {
      const response = await request(app)
        .get(`/campaigns/1/ux`)
        .set("Authorization", "Bearer admin");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("sentiments");
      expect(response.body.sentiments).toHaveLength(2);

      expect(response.body.sentiments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            cluster: {
              id: 1,
              name: "Cluster 1",
            },
            value: 1,
            comment: "Comment 1",
          }),
          expect.objectContaining({
            cluster: {
              id: 2,
              name: "Cluster 2",
            },
            value: 5,
            comment: "Comment 2",
          }),
          expect.not.objectContaining({
            cluster: {
              id: 2,
              name: "Cluster 3",
            },
            value: 4,
            comment: "Comment 3",
          }),
        ])
      );
    });
  });

  describe("Published", () => {
    beforeAll(async () => {
      await tryber.tables.UxCampaignData.do().insert([
        {
          campaign_id: 1,
          published: 1,
          methodology_description: "Methodology description",
          methodology_type: "qualitative",
          goal: "Goal",
          users: 10,
        },
      ]);
    });
    afterAll(async () => {
      await tryber.tables.UxCampaignData.do().delete();
    });

    it("Should return the sentiments if exist the cluster", async () => {
      const response = await request(app)
        .get(`/campaigns/1/ux`)
        .set("Authorization", "Bearer admin");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("sentiments");
      expect(response.body.sentiments).toHaveLength(2);

      expect(response.body.sentiments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            cluster: {
              id: 1,
              name: "Cluster 1",
            },
            value: 1,
            comment: "Comment 1",
          }),
          expect.objectContaining({
            cluster: {
              id: 2,
              name: "Cluster 2",
            },
            value: 5,
            comment: "Comment 2",
          }),
          expect.not.objectContaining({
            cluster: {
              id: 2,
              name: "Cluster 3",
            },
            value: 4,
            comment: "Comment 3",
          }),
        ])
      );
    });
  });
});
