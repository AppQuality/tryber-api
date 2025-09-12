import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("GET /campaigns/{CampaignId}/tasks", () => {
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
    await tryber.tables.WpAppqCampaignTask.do().insert([
      {
        id: 100,
        campaign_id: 100,
        title: "Task 100",
        simple_title: "Task 100",
        content: "Task 100 content",
        is_required: 1,
        jf_code: "jf_code_100",
        jf_text: "jf_text_100",
        info: "Task 100 info",
        prefix: "Task 100 prefix",
        position: 2,
      },
      {
        id: 200,
        campaign_id: 100,
        title: "Task 200",
        simple_title: "Task 200",
        content: "Task 200 content",
        is_required: 1,
        jf_code: "jf_code_200",
        jf_text: "jf_text_200",
        info: "Task 200 info",
        prefix: "Task 200 prefix",
        position: 2,
      },
      {
        id: 300,
        campaign_id: 900,
        title: "Task 300",
        simple_title: "Task 300",
        content: "Task 300 content",
        is_required: 1,
        jf_code: "jf_code_300",
        jf_text: "jf_text_300",
        info: "Task 300 info",
        prefix: "Task 300 prefix",
        position: 1,
      },
      {
        id: 400,
        campaign_id: 100,
        title: "Task 400",
        simple_title: "Task 400",
        content: "Task 400 content",
        is_required: 1,
        jf_code: "jf_code_400",
        jf_text: "jf_text_400",
        info: "Task 400 info",
        prefix: "Task 400 prefix",
        position: 1,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
  });
  // should answer 403 if not logged in
  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/campaigns/100/tasks");
    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      err: "unauthorized",
    });
  });
  it("Should answer 400 if campaign does not exist", async () => {
    const response = await request(app)
      .get("/campaigns/999/tasks")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Campaign not found",
    });
  });
  it("Should answer 200 if logged in as admin", async () => {
    const response = await request(app)
      .get("/campaigns/100/tasks")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should answer 403 if logged in as non admin", async () => {
    const response = await request(app)
      .get("/campaigns/100/tasks")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should return an empty array if no usecases are found", async () => {
    const response = await request(app)
      .get("/campaigns/110/tasks")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
  it("Should return the usecases for the campaign", async () => {
    const response = await request(app)
      .get("/campaigns/100/tasks")
      .set("Authorization", " Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 100,
          name: "Task 100",
          content: "Task 100 content",
          campaign_id: 100,
        }),
        expect.objectContaining({
          id: 200,
          name: "Task 200",
          content: "Task 200 content",
          campaign_id: 100,
        }),
        expect.objectContaining({
          id: 400,
          name: "Task 400",
          content: "Task 400 content",
          campaign_id: 100,
        }),
      ])
    );
  });

  it("Should return the usecases ordered by position ASC, id ASC", async () => {
    const response = await request(app)
      .get("/campaigns/100/tasks")
      .set("Authorization", " Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);
    // 400, 100, 200
    expect(response.body[0].id).toBe(400);
    expect(response.body[1].id).toBe(100);
    expect(response.body[2].id).toBe(200);
  });
});
