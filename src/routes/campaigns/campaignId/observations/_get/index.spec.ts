import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

beforeAll(async () => {
  await tryber.tables.WpAppqEvdCampaign.do().insert({
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
  });
  await tryber.tables.WpAppqUsecaseMediaObservations.do().insert([
    {
      id: 1,
      media_id: 1,
      name: "Observation1 name",
      video_ts: 59,
      description: "Observation1 description",
      ux_note: "Observation1 ux_notes",
    },
    {
      id: 2,
      media_id: 2,
      name: "Observation2 name",
      video_ts: 59,
      description: "Observation2 description",
      ux_note: "Observation2 ux_notes",
    },
  ]);
  await tryber.tables.WpAppqUserTaskMedia.do().insert([
    {
      id: 1,
      campaign_task_id: 10,
      user_task_id: 1,
      tester_id: 1,
      location: "https://www.youtube.com/@tryber_official",
    },
    {
      id: 2,
      campaign_task_id: 20,
      user_task_id: 1,
      tester_id: 1,
      location: "https://www.youtube.com/@tryber_official",
    },
  ]);
  await tryber.tables.WpAppqCampaignTask.do().insert([
    {
      id: 10,
      campaign_id: 1,
      cluster_id: 10,
      title: "Campaign Task1 title",
      simple_title: "Campaign Task1 simple_title",
      content: "Campaign Task1 content",
      info: "Campaign Task1 info",
      prefix: "Campaign Task1 prefix",
      is_required: 1,
      jf_code: "Campaign Task1 jf_code",
      jf_text: "Campaign Task1 jf_text",
    },
    {
      id: 20,
      campaign_id: 2,
      cluster_id: 20,
      title: "Campaign Task2 title",
      simple_title: "Campaign Task2 simple_title",
      content: "Campaign Task2 content",
      info: "Campaign Task2 info",
      prefix: "Campaign Task2 prefix",
      is_required: 0,
      jf_code: "Campaign Task2 jf_code",
      jf_text: "Campaign Task2 jf_text",
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
describe("GET /campaigns/:campaignId/observations", () => {
  it("Should return 400 if campaign does not exist", async () => {
    const response = await request(app)
      .get("/campaigns/999/observations")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(400);
  });
  it("Should return 403 if the user does not have permission", async () => {
    const response = await request(app)
      .get("/campaigns/1/observations")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 200 if the user have olp permission on CP", async () => {
    const response = await request(app)
      .get("/campaigns/1/observations")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(200);
  });

  it("Should return 200 if the user have olp permission on all CP", async () => {
    const response = await request(app)
      .get("/campaigns/1/observations")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
  });

  it("Should return 200 if the user is admin", async () => {
    const response = await request(app)
      .get("/campaigns/1/observations")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should return items array", async () => {
    const response = await request(app)
      .get("/campaigns/1/observations")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toBeInstanceOf(Array);
  });

  it("Should return observations of a specific campaign", async () => {
    const response = await request(app)
      .get("/campaigns/1/observations")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.body.items.length).toBe(1);
  });

  it("Should return items with id as number", async () => {
    const response = await request(app)
      .get("/campaigns/1/observations")
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
      .get("/campaigns/1/observations")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
        }),
      ])
    );
  });
  it("Should return items with name as string", async () => {
    const response = await request(app)
      .get("/campaigns/1/observations")
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
      .get("/campaigns/1/observations")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Observation1 name",
        }),
      ])
    );
  });
  it("Should return items with time as number", async () => {
    const response = await request(app)
      .get("/campaigns/1/observations")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          time: expect.any(Number),
        }),
      ])
    );
  });
  it("Should return items with time", async () => {
    const response = await request(app)
      .get("/campaigns/1/observations")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          time: 59,
        }),
      ])
    );
  });

  it("Should return items with cluster as id number and name string", async () => {
    const response = await request(app)
      .get("/campaigns/1/observations")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cluster: expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
          }),
        }),
      ])
    );
  });
  it("Should return items with cluster", async () => {
    const response = await request(app)
      .get("/campaigns/1/observations")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cluster: expect.objectContaining({
            id: 10,
            name: "Cluster10 title",
          }),
        }),
      ])
    );
  });
});
