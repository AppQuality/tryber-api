import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("GET /campaigns/{cid}/bugs/{bid}", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdBug.do().insert({
      id: 101,
      campaign_id: 100,
      description: "This is a test bug",
      wp_user_id: 11111,
      reviewer: 11111,
      last_editor_id: 11111,
      application_section_id: 100,

      status_id: 2, // Approved
      severity_id: 1, // LOW
      bug_replicability_id: 1, // Sometimes
      bug_type_id: 1, // Crash
    });
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 100,
      title: "Test Campaign",
      description: "This is a test campaign",
      page_manual_id: 1,
      page_preview_id: 1,
      pm_id: 11111,
      platform_id: 1,
      start_date: "2025-01-01",
      end_date: "2025-12-31",
      customer_id: 11111,
      customer_title: "Test Customer",
      project_id: 1,
    });
    await tryber.tables.WpAppqEvdBugStatus.do().insert({
      id: 2,
      name: "Approved",
      description: "Bug is approved",
    });
    await tryber.tables.WpAppqEvdSeverity.do().insert({
      id: 1,
      name: "LOW",
      description: "Low severity",
    });
    await tryber.tables.WpAppqEvdBugType.do().insert({
      id: 1,
      name: "Crash",
      description: "Bug causes a crash",
    });
    await tryber.tables.WpAppqEvdBugReplicability.do().insert({
      id: 1,
      name: "Sometimes",
      description: "Bug happens sometimes",
    });
    await tryber.tables.WpAppqCampaignTask.do().insert({
      id: 100,
      title: "Test Task",
      simple_title: "Test Task",
      content: "This is a test task",
      campaign_id: 100,
      jf_code: "TEST-123",
      jf_text: "Test Task",
      is_required: 0,
      info: "This is a test task info",
      prefix: "TEST",
    });
  });

  afterAll(async () => {
    await tryber.tables.WpAppqEvdBug.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
  });

  it("Should answer 403 if user is not logged in", async () => {
    const response = await request(app).get("/campaigns/100/bugs/101");
    expect(response.status).toBe(403);
  });

  it("Should answer 403 if user is not admin", async () => {
    const response = await request(app)
      .get("/campaigns/100/bugs/101")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should answer 200 if user is admin", async () => {
    const response = await request(app)
      .get("/campaigns/100/bugs/101")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should answer 200 if user is has olp permission", async () => {
    const response = await request(app)
      .get("/campaigns/100/bugs/101")
      .set("Authorization", 'Bearer tester olp {"appq_bug":[100]}');
    expect(response.status).toBe(200);
  });

  // // It should answer 400 if campaign does not exist
  // it("Should answer 400 if campaign does not exist", async () => {
  //   const response = await request(app)
  //     .get(`/campaigns/999999/bugs/${bug_1.id}`)
  //     .set("Authorization", "Bearer user");
  //   expect(response.status).toBe(400);
  // });

  // // It should answer 403 if the user has no permissions to see the campaign
  // it("Should answer 403 if the user has no permissions to see the campaign", async () => {
  //   const response = await request(app)
  //     .get(`/campaigns/${campaign_2.id}/bugs/${bug_5_from_unknown.id}`)
  //     .set("Authorization", "Bearer user");
  //   expect(response.status).toBe(403);
  // });

  // // It should answer 200 with the campaign
  // it("Should answer 200 with the bug", async () => {
  //   const response = await request(app)
  //     .get(`/campaigns/${campaign_1.id}/bugs/${bug_1.id}`)
  //     .set("Authorization", "Bearer user");
  //   expect(response.status).toBe(200);

  //   expect(response.body).toEqual(
  //     expect.objectContaining({
  //       id: bug_1.id,
  //       status: expect.objectContaining({
  //         id: bug_1.status_id,
  //         name: "Approved",
  //       }),
  //       severity: expect.objectContaining({
  //         id: bug_1.severity_id,
  //         name: "LOW",
  //       }),
  //       replicability: expect.objectContaining({
  //         id: bug_1.bug_replicability_id,
  //         name: "Sometimes",
  //       }),
  //       type: expect.objectContaining({
  //         id: bug_1.bug_type_id,
  //         name: "Crash",
  //       }),
  //     })
  //   );

  //   expect(response.body.media.length).toEqual(2);
  // });

  // // It should answer 400 if an invalid campaign id is provided
  // it("Should answer 400 if an invalid campaign id is provided", async () => {
  //   const response = await request(app)
  //     .get(`/campaigns/invalid/bugs/${bug_1.id}`)
  //     .set("Authorization", "Bearer user");
  //   expect(response.status).toBe(400);
  // });

  // it("Should answer 400 if an invalid bug id is provided", async () => {
  //   const response = await request(app)
  //     .get(`/campaigns/${campaign_1.id}/bugs/invalid`)
  //     .set("Authorization", "Bearer user");
  //   expect(response.status).toBe(400);
  // });
});
