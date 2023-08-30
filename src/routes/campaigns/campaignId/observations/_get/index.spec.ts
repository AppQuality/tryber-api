import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const task = {
  campaign_id: 1,
  cluster_id: 10,
  title: "Campaign Task title",
  simple_title: "Campaign Task simple_title",
  content: "Campaign Task content",
  info: "Campaign Task info",
  prefix: "Campaign Task prefix",
  is_required: 1,
  jf_code: "Campaign Task jf_code",
  jf_text: "Campaign Task jf_text",
};

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
  await tryber.tables.WpAppqEvdProfile.do().insert({
    id: 1,
    wp_user_id: 1,
    name: "Tester1",
    email: "jhon.doe@tryber.me",
    employment_id: 1,
    education_id: 1,
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
    {
      id: 3,
      media_id: 3,
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
      location:
        "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    },
    {
      id: 2,
      campaign_task_id: 20,
      user_task_id: 1,
      tester_id: 1,
      location:
        "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    },
    {
      id: 3,
      campaign_task_id: 30,
      user_task_id: 1,
      tester_id: 1,
      location:
        "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    },
  ]);
  await tryber.tables.WpAppqCampaignTask.do().insert([
    {
      ...task,
      id: 10,
      campaign_id: 1,
    },
    {
      ...task,
      id: 20,
      campaign_id: 2,
    },
    {
      ...task,
      id: 30,
      campaign_id: 1,
      cluster_id: 30,
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
    {
      id: 30,
      campaign_id: 1,
      title: "Cluster title",
      subtitle: "Cluster subtitle",
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
    expect(response.body.items.length).toBe(2);
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

  it("Should return items with tester as id number and name string", async () => {
    const response = await request(app)
      .get("/campaigns/1/observations")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester: expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
          }),
        }),
      ])
    );
  });

  it("Should return items with tester", async () => {
    const response = await request(app)
      .get("/campaigns/1/observations")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester: expect.objectContaining({
            id: 1,
            name: "Tester1",
          }),
        }),
      ])
    );
  });

  it("Should return items with media", async () => {
    const response = await request(app)
      .get("/campaigns/1/observations")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          media: expect.objectContaining({
            id: 1,
            url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            streamUrl:
              "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny-stream.m3u8",
          }),
        }),
      ])
    );
  });

  it("Should allow filtering by cluster", async () => {
    const response = await request(app)
      .get("/campaigns/1/observations?filterBy[cluster]=10")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.body.items.length).toBe(1);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          cluster: expect.objectContaining({
            id: 10,
            name: "Cluster10 title",
          }),
        }),
      ])
    );
  });
  it("Should allow filtering by multiple cluster", async () => {
    const response = await request(app)
      .get("/campaigns/1/observations?filterBy[cluster]=10,30")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.body.items.length).toBe(2);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          cluster: expect.objectContaining({
            id: 10,
            name: "Cluster10 title",
          }),
        }),
        expect.objectContaining({
          id: 3,
          cluster: expect.objectContaining({
            id: 30,
            name: "Cluster title",
          }),
        }),
      ])
    );
  });
});

describe("GET /campaigns/:campaignId/observations - there are no observation", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqUsecaseMediaObservations.do().delete();
  });
  it("Should return items array", async () => {
    const response = await request(app)
      .get("/campaigns/1/observations")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toBeInstanceOf(Array);
  });

  it("Should return items as empty array if there are no observations", async () => {
    const response = await request(app)
      .get("/campaigns/1/observations")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toEqual([]);
  });
});
