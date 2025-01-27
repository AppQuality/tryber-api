import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const yesterday = new Date(new Date().getTime() - 86400000).toISOString();
const tomorrow = new Date(new Date().getTime() + 86400000).toISOString();

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
      profile_id: 1,
      reviewer: 1,
      last_editor_id: 1,
      severity_id: 1,
      bug_replicability_id: 1,
      bug_type_id: 1,
      internal_id: "internal_id_1",
      message: "this is title Bug 1",
      is_favorite: 0,
      created: yesterday,
      updated: tomorrow,
    },
    {
      id: 2,
      campaign_id: 1,
      status_id: 1,
      wp_user_id: 1,
      profile_id: 1,
      reviewer: 1,
      last_editor_id: 1,
      severity_id: 1,
      bug_replicability_id: 1,
      bug_type_id: 1,
      internal_id: "internal_id_1",
      message: "this is title Bug 2",
      is_favorite: 1,
      created: yesterday,
      updated: tomorrow,
    },
    {
      id: 3,
      campaign_id: 1,
      status_id: 1,
      wp_user_id: 1,
      profile_id: 1,
      reviewer: 1,
      last_editor_id: 1,
      severity_id: 1,
      bug_replicability_id: 1,
      bug_type_id: 1,
      internal_id: "internal_id_1",
      message: "this is title Bug 3",
      is_favorite: 0,
      created: yesterday,
      updated: tomorrow,
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

describe("GET /campaigns/campaignId/bugs", () => {
  it("Should return 403 if logged out", async () => {
    const response = await request(app).get("/campaigns/1/bugs");
    expect(response.status).toBe(403);
  });

  it("Should return 403 if logged in as not admin user", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 200 if logged in as admin", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should return 200 if logged in as tester with olp", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs")
      .set("Authorization", 'Bearer tester olp {"appq_bug":[1]}');
    expect(response.status).toBe(200);
  });

  it("Should return a bug list", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
        }),
        expect.objectContaining({
          id: 2,
        }),
        expect.objectContaining({
          id: 3,
        }),
      ])
    );
    expect(response.body.items.length).toBe(3);
  });

  it("Should return a bug list with is_favourite foreach bug", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          isFavourite: false,
        }),
        expect.objectContaining({
          id: 2,
          isFavourite: true,
        }),
        expect.objectContaining({
          id: 3,
          isFavourite: false,
        }),
      ])
    );
    expect(response.body.items.length).toBe(3);
  });

  it("Should return a bug list with created foreach bug", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");

    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          created: yesterday.slice(0, 19).replace("T", " "),
        }),
        expect.objectContaining({
          id: 2,
          created: yesterday.slice(0, 19).replace("T", " "),
        }),
        expect.objectContaining({
          id: 3,
          created: yesterday.slice(0, 19).replace("T", " "),
        }),
      ])
    );
    expect(response.body.items.length).toBe(3);
  });

  it("Should return a bug list with updated foreach bug", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");

    expect(response.body.items).toHaveLength(3);
    expect(response.body.items[0]).toHaveProperty(
      "updated",
      tomorrow.slice(0, 19).replace("T", " ")
    );
    expect(response.body.items[1]).toHaveProperty(
      "updated",
      tomorrow.slice(0, 19).replace("T", " ")
    );
    expect(response.body.items[2]).toHaveProperty(
      "updated",
      tomorrow.slice(0, 19).replace("T", " ")
    );
  });

  it("Should return a bug list with testerId foreach bug", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");

    expect(response.body.items).toHaveLength(3);
    expect(response.body.items[0]).toHaveProperty("tester", { id: 1 });
    expect(response.body.items[1]).toHaveProperty("tester", { id: 1 });
    expect(response.body.items[2]).toHaveProperty("tester", { id: 1 });
  });
});
