import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const campaign_1 = {
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
};

const campaign_2 = {
  ...campaign_1,
  id: 2,
  customer_id: 1,
};

const campaign_3 = {
  ...campaign_1,
  id: 3,
  customer_id: 2,
};

const bug_1 = {
  id: 12345,
  campaign_id: campaign_1.id,
  description: "This is a test bug",
  wp_user_id: 11111,
  reviewer: 11111,
  last_editor_id: 11111,
  application_section_id: 100,
  status_id: 2, // Approved
  severity_id: 1, // LOW
  bug_replicability_id: 1, // Sometimes
  bug_type_id: 1, // Crash
};

const bug_2 = {
  ...bug_1,
  id: bug_1.id + 1,
  campaign_id: campaign_2.id,
};

const bug_3 = {
  ...bug_1,
  id: bug_1.id + 2,
  campaign_id: campaign_3.id,
};

const ai_review_1 = {
  ai_status: "approved",
  ai_reason: "Bug is valid",
  ai_notes: "Bug has been reviewed by AI",
  score_percentage: 95,
  campaign_id: campaign_1.id,
  bug_id: bug_1.id,
};

const ai_review_1_v2 = {
  ai_status: "approved",
  ai_reason: "Bug is valid",
  ai_notes: "Bug has been reviewed by AI",
  score_percentage: 95,
  campaign_id: campaign_1.id,
  bug_id: bug_1.id,
  version: "v2",
};

describe("GET /campaigns/{cid}/bugs/{bid}/aiReview", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdBug.do().insert([bug_1, bug_2, bug_3]);
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      campaign_1,
      campaign_2,
      campaign_3,
    ]);
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
      id: 123,
      title: "Test Task",
      simple_title: "Test Task",
      content: "This is a test task",
      campaign_id: campaign_1.id,
      jf_code: "TEST-123",
      jf_text: "Test Task",
      is_required: 0,
      info: "This is a test task info",
      prefix: "TEST",
    });
    await tryber.tables.AiBugReview.do().insert({
      ...ai_review_1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    await tryber.tables.AiBugReview.do().insert({
      ...ai_review_1_v2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    await tryber.tables.AiBugReview.do().insert({
      ...ai_review_1,
      campaign_id: campaign_3.id,
      bug_id: bug_3.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  afterAll(async () => {
    await tryber.tables.WpAppqEvdBug.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqEvdBugStatus.do().delete();
    await tryber.tables.WpAppqEvdSeverity.do().delete();
    await tryber.tables.WpAppqEvdBugType.do().delete();
    await tryber.tables.WpAppqEvdBugReplicability.do().delete();
    await tryber.tables.WpAppqCampaignTask.do().delete();
    await tryber.tables.AiBugReview.do().delete();
  });

  it("Should answer 403 if user is not logged in", async () => {
    const response = await request(app).get(
      `/campaigns/${campaign_1.id}/bugs/${bug_1.id}/aiReview`
    );
    expect(response.status).toBe(403);
  });

  it("Should answer 403 if user is not admin and has not appq_campaign olp", async () => {
    const response = await request(app)
      .get(`/campaigns/${campaign_1.id}/bugs/${bug_1.id}/aiReview`)
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[2]}');
    expect(response.status).toBe(403);
  });

  it("Should answer 403 if user is not admin and has not appq_bug olp", async () => {
    const response = await request(app)
      .get(`/campaigns/${campaign_1.id}/bugs/${bug_1.id}/aiReview`)
      .set("Authorization", 'Bearer tester olp {"appq_bug":[2]}');
    expect(response.status).toBe(403);
  });

  it("Should answer 200 if user is admin", async () => {
    const response = await request(app)
      .get(`/campaigns/${campaign_1.id}/bugs/${bug_1.id}/aiReview`)
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should answer 403 if user has permissions", async () => {
    const response = await request(app)
      .get(`/campaigns/${campaign_3.id}/bugs/${bug_3.id}/aiReview`)
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[3]}');
    expect(response.status).toBe(403);
  });

  it("Should answer 403 if user has full campaign permission", async () => {
    const response = await request(app)
      .get(`/campaigns/${campaign_3.id}/bugs/${bug_3.id}/aiReview`)
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(403);
  });

  it("Should answer 200 if user has bugs permission", async () => {
    const response = await request(app)
      .get(`/campaigns/${campaign_3.id}/bugs/${bug_3.id}/aiReview`)
      .set("Authorization", 'Bearer tester olp {"appq_bug":[3]}');
    expect(response.status).toBe(200);
  });

  it("Should answer 200 if user has full bugs permission", async () => {
    const response = await request(app)
      .get(`/campaigns/${campaign_3.id}/bugs/${bug_3.id}/aiReview`)
      .set("Authorization", 'Bearer tester olp {"appq_bug":true}');
    expect(response.status).toBe(200);
  });

  it("Should answer 200 if user has bugs permission and other olps", async () => {
    const response = await request(app)
      .get(`/campaigns/${campaign_3.id}/bugs/${bug_3.id}/aiReview`)
      .set(
        "Authorization",
        'Bearer tester olp {"appq_bug":true,"appq_campaign":[3]}'
      );
    expect(response.status).toBe(200);
  });

  it("Should return the AI review data (version = v1)", async () => {
    const response = await request(app)
      .get(`/campaigns/${campaign_1.id}/bugs/${bug_1.id}/aiReview`)
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ai_status: ai_review_1.ai_status,
      ai_reason: ai_review_1.ai_reason,
      ai_notes: ai_review_1.ai_notes,
      score_percentage: ai_review_1.score_percentage,
    });
  });

  it("Should answer 404 if there is no ai review data", async () => {
    const response = await request(app)
      .get(`/campaigns/${campaign_2.id}/bugs/${bug_2.id}/aiReview`)
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(404);
  });
});
