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
describe("GET /campaigns/{campaignId}/ux - data", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([{ ...campaign, id: 1 }]);
    await tryber.tables.UxCampaignData.do().insert({
      campaign_id: 1,
      version: 1,
    });
    await tryber.tables.UxCampaignInsights.do().insert({
      campaign_id: 1,
      version: 1,
      title: "Test Insight",
      description: "Test Description",
      severity_id: 1,
      cluster_ids: "1,2",
      order: 1,
    });
    await tryber.tables.UxCampaignInsights.do().insert({
      campaign_id: 1,
      version: 1,
      title: "Test Insight All Cluster",
      description: "Test Description All Cluster",
      severity_id: 1,
      cluster_ids: "0",
      order: 0,
    });
    await tryber.tables.WpAppqUsecaseCluster.do().insert({
      id: 1,
      campaign_id: 1,
      title: "Test Cluster",
      subtitle: "",
    });
    await tryber.tables.WpAppqUsecaseCluster.do().insert({
      id: 2,
      campaign_id: 1,
      title: "Test Cluster 2",
      subtitle: "",
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.UxCampaignInsights.do().delete();
    await tryber.tables.WpAppqUsecaseCluster.do().delete();
  });

  it("Should return all the findings", async () => {
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("insight");
    expect(response.body.insight).toHaveLength(2);
    expect(response.body.insight[0]).toEqual(
      expect.objectContaining({
        title: "Test Insight All Cluster",
        description: "Test Description All Cluster",
        severity: expect.objectContaining({
          id: 1,
          name: "Minor",
        }),
        cluster: "all",
        videoPart: expect.arrayContaining([]),
      })
    );
    expect(response.body.insight[1]).toEqual(
      expect.objectContaining({
        title: "Test Insight",
        description: "Test Description",
        severity: expect.objectContaining({
          id: 1,
          name: "Minor",
        }),
        cluster: [
          expect.objectContaining({
            id: 1,
            name: "Test Cluster",
          }),
          expect.objectContaining({
            id: 2,
            name: "Test Cluster 2",
          }),
        ],
        videoPart: expect.arrayContaining([]),
      })
    );
  });

  // it("Should return all the video part in a finding", async () => {
  //   const response = await request(app)
  //     .get("/campaigns/1/ux")
  //     .set("Authorization", "Bearer admin");
  //   expect(response.body).toHaveProperty("insight");
  //   expect(response.body.insight).toHaveLength(1);
  //   expect(response.body.insight[0]).toEqual(
  //     expect.objectContaining({
  //       title: "Test Insight",
  //       description: "Test Description",
  //       severity: expect.objectContaining({
  //         id: 1,
  //         name: "Minor",
  //       }),
  //       cluster: [
  //         expect.objectContaining({
  //           id: 1,
  //           name: "Test Cluster",
  //         }),
  //       ],
  //       videoPart: expect.arrayContaining([]),
  //     })
  //   );
  // });
});
