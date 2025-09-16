import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("POST /campaigns/{CampaignId}/tasks", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        id: 100,
        title: "Campaign 1",
        customer_title: "Customer Campaign 1",
        platform_id: 1,
        start_date: "2023-01-01",
        end_date: "2023-12-31",
        page_preview_id: 1,
        page_manual_id: 1,
        customer_id: 1,
        pm_id: 11111,
        project_id: 1,
      },
      {
        id: 110,
        title: "Campaign 110",
        customer_title: "Customer Campaign 110",
        platform_id: 1,
        start_date: "2023-01-01",
        end_date: "2023-12-31",
        page_preview_id: 1,
        page_manual_id: 1,
        customer_id: 1,
        pm_id: 11111,
        project_id: 1,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
  });
  afterEach(async () => {
    await tryber.tables.WpAppqCampaignTask.do().delete();
  });
  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).post("/campaigns/100/tasks");
    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      err: "unauthorized",
    });
  });
  it("Should answer 400 if campaign not exist", async () => {
    const response = await request(app)
      .post("/campaigns/999/tasks")
      .send({
        title: "new task",
        content: "new task content",
        is_required: 1,
        position: 10,
      })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Campaign not found",
    });
  });
  it("Should answer 403 if logged as tester", async () => {
    const response = await request(app)
      .post("/campaigns/100/tasks")
      .send({
        title: "new task",
        content: "new task content",
        is_required: 1,
        position: 10,
      })
      // .set("Authorization", 'Bearer tester olp {"appq_campaign":[100]}')
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      message: "You are not authorized to do this",
    });
  });
  it("Should answer 403 if logged as tester without campaign access", async () => {
    const response = await request(app)
      .post("/campaigns/100/tasks")
      .send({
        title: "new task",
        content: "new task content",
        is_required: 1,
        position: 10,
      })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":false}');
    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      message: "You are not authorized to do this",
    });

    const response2 = await request(app)
      .post("/campaigns/100/tasks")
      .send({
        title: "new task",
        content: "new task content",
        is_required: 1,
        position: 10,
      })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[150]}');
    expect(response2.status).toBe(403);
    expect(response2.body).toMatchObject({
      message: "You are not authorized to do this",
    });
  });
  it("Should answer 201 if logged in as admin", async () => {
    const response = await request(app)
      .post("/campaigns/100/tasks")
      .send({
        title: "new task",
        content: "new task content",
        is_required: 1,
        position: 10,
      })
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(Number),
      title: expect.any(String),
      content: expect.any(String),
    });
  });
  it("Should answer 201 if logged in as tester with permission", async () => {
    const response = await request(app)
      .post("/campaigns/100/tasks")
      .send({
        title: "new task",
        content: "new task content",
        is_required: 1,
        position: 10,
      })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(201);

    const response2 = await request(app)
      .post("/campaigns/100/tasks")
      .send({
        title: "new task",
        content: "new task content",
        is_required: 1,
        position: 10,
      })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[100]}');
    expect(response2.status).toBe(201);
  });

  it("Should create new task", async () => {
    const response = await request(app)
      .post("/campaigns/100/tasks")
      .send({
        title: "new task",
        content: "new task content",
        is_required: 1,
        position: 10,
      })
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(201);
    const newTaskId = response.body.id;

    const getResponse = await request(app)
      .get("/campaigns/100/tasks")
      .set("Authorization", "Bearer admin");

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: newTaskId,
          name: "new task",
          content: "new task content",
          campaign_id: 100,
        }),
      ])
    );
  });

  it("Should return new task data", async () => {
    const requestBody = {
      title: "new task",
      content: "new task content",
      is_required: 1,
      position: 10,
    };
    const response = await request(app)
      .post("/campaigns/100/tasks")
      .send(requestBody)
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      id: expect.any(Number),
      title: requestBody.title,
      content: requestBody.content,
    });
  });
});
