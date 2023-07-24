import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

beforeAll(async () => {
  await tryber.tables.WpAppqEvdCampaign.do().insert([
    {
      id: 1,
      platform_id: 1,
      start_date: "2020-01-01",
      end_date: "2020-01-01",
      title: "This is the title",
      page_preview_id: 1,
      page_manual_id: 1,
      customer_id: 1,
      pm_id: 1,
      project_id: 1,
      customer_title: "",
      campaign_pts: 200,
    },
    {
      id: 2,
      platform_id: 1,
      start_date: "2020-01-01",
      end_date: "2020-01-01",
      title: "This is the title",
      page_preview_id: 1,
      page_manual_id: 1,
      customer_id: 1,
      pm_id: 1,
      project_id: 1,
      customer_title: "",
      campaign_pts: 200,
    },
  ]);

  await tryber.tables.WpAppqUsecaseCluster.do().insert([
    {
      id: 10,
      campaign_id: 1,
      title: "Cluster10 title",
      subtitle: "Cluster10 subtitle",
    },
    {
      id: 20,
      campaign_id: 2,
      title: "Cluster20 title",
      subtitle: "Cluster20 subtitle",
    },
  ]);
});
describe("GET /campaigns/:campaignId/clusters", () => {
  it("Should return 400 if campaign does not exist", async () => {
    const response = await request(app)
      .get("/campaigns/999/clusters")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(400);
  });
  it("Should return 403 if the user does not have permission", async () => {
    const response = await request(app)
      .get("/campaigns/1/clusters")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 200 if the user have olp permission on CP", async () => {
    const response = await request(app)
      .get("/campaigns/1/clusters")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(200);
  });

  it("Should return 200 if the user have olp permission on all CP", async () => {
    const response = await request(app)
      .get("/campaigns/1/clusters")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
  });

  it("Should return 200 if the user is admin", async () => {
    const response = await request(app)
      .get("/campaigns/1/clusters")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should return items array", async () => {
    const response = await request(app)
      .get("/campaigns/1/clusters")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toBeInstanceOf(Array);
  });

  it("Should return clusters of a specific campaign", async () => {
    const response = await request(app)
      .get("/campaigns/1/clusters")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.body.items.length).toBe(1);
  });

  it("Should return items with id as number", async () => {
    const response = await request(app)
      .get("/campaigns/1/clusters")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
        }),
      ])
    );
  });
  it("Should return items with id", async () => {
    const response = await request(app)
      .get("/campaigns/1/clusters")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 10,
        }),
      ])
    );
  });
  it("Should return items with name as string", async () => {
    const response = await request(app)
      .get("/campaigns/1/clusters")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: expect.any(String),
        }),
      ])
    );
  });
  it("Should return items with name", async () => {
    const response = await request(app)
      .get("/campaigns/1/clusters")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Cluster10 title",
        }),
      ])
    );
  });
});
