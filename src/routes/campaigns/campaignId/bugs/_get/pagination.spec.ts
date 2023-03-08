import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

beforeAll(async () => {
  await tryber.tables.WpAppqEvdProfile.do().insert({
    id: 1,
    name: "John",
    surname: "Doe",
    wp_user_id: 1,
    email: "",
    employment_id: 1,
    education_id: 1,
  });
  await tryber.tables.WpUsers.do().insert({ ID: 1 });
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
  });

  await tryber.tables.WpAppqEvdBug.do().insert([
    {
      id: 1,
      campaign_id: 1,
      status_id: 1,
      wp_user_id: 1,
      reviewer: 1,
      last_editor_id: 1,
      severity_id: 1,
      bug_replicability_id: 1,
      bug_type_id: 1,
      internal_id: "internal_id_1",
      message: "this is title Bug 1",
    },
    {
      id: 2,
      campaign_id: 1,
      status_id: 1,
      wp_user_id: 1,
      reviewer: 1,
      last_editor_id: 1,
      severity_id: 1,
      bug_replicability_id: 1,
      bug_type_id: 1,
      internal_id: "internal_id_1",
      message: "this is title Bug 2",
    },
    {
      id: 3,
      campaign_id: 1,
      status_id: 1,
      wp_user_id: 1,
      reviewer: 1,
      last_editor_id: 1,
      severity_id: 1,
      bug_replicability_id: 1,
      bug_type_id: 1,
      internal_id: "internal_id_1",
      message: "this is title Bug 3",
    },
  ]);

  await tryber.tables.WpAppqEvdSeverity.do().insert({
    id: 1,
    name: "This is the Severity name 1",
  });

  await tryber.tables.WpAppqEvdBugStatus.do().insert({
    id: 1,
    name: "This is the Status name 1",
  });
  await tryber.tables.WpAppqEvdBugType.do().insert({
    id: 1,
    name: "This is the Type name",
  });
});

describe("GET /campaigns/campaignId/bugs - pagination", () => {
  it("Should return a paginated bug list", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs")
      .set("Authorization", "Bearer admin");

    expect(response.body).toHaveProperty("items");
    expect(response.body.items.length).toBe(3);

    expect(response.body).toHaveProperty("start");
    expect(response.body.start).toBe(0);

    expect(response.body).toHaveProperty("size");
    expect(response.body.size).toBe(3);

    expect(response.body).toHaveProperty("total");
    expect(response.body.total).toBe(3);
  });

  it("Should return a bug list limit 1, start = 0 as default", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?limit=1")
      .set("Authorization", "Bearer admin");

    expect(response.body.items.length).toBe(1);
    expect(response.body.items[0].id).toBe(3);
    expect(response.body.start).toBe(0);
    expect(response.body.size).toBe(1);
    expect(response.body.total).toBe(3);
    expect(response.body.limit).toBe(1);
  });

  it("Should return a bug list limit 1 start 2", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?limit=1&start=2")
      .set("Authorization", "Bearer admin");

    expect(response.body.items.length).toBe(1);
    expect(response.body.items[0].id).toBe(1);
    expect(response.body.start).toBe(2);
    expect(response.body.size).toBe(1);
    expect(response.body.total).toBe(3);
    expect(response.body.limit).toBe(1);
  });

  it("Without limit set should return all bugs", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?start=2")
      .set("Authorization", "Bearer admin");

    expect(response.body.items.length).toBe(3);
    expect(response.body.size).toBe(3);
    expect(response.body.total).toBe(3);
  });
});
