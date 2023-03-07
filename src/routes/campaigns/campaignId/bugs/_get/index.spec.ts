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

  await tryber.tables.WpAppqEvdBug.do().insert({
    // Bug 1
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
  });

  await tryber.tables.WpAppqEvdBug.do().insert({
    // Bug 2
    campaign_id: 1,
    status_id: 2,
    wp_user_id: 1,
    reviewer: 1,
    last_editor_id: 1,
    severity_id: 2,
    bug_replicability_id: 1,
    bug_type_id: 1,
    internal_id: "internal_id_1",
    message: "this is title Bug 2",
  });
  await tryber.tables.WpAppqEvdBug.do().insert({
    // Bug 3
    campaign_id: 1,
    status_id: 3,
    wp_user_id: 1,
    reviewer: 1,
    last_editor_id: 1,
    severity_id: 3,
    bug_replicability_id: 1,
    bug_type_id: 1,
    internal_id: "internal_id_1",
    message: "this is title Bug 3",
  });

  await tryber.tables.WpAppqEvdSeverity.do().insert({
    id: 1,
    name: "This is the Severity name 1",
  });
  await tryber.tables.WpAppqEvdSeverity.do().insert({
    id: 2,
    name: "This is the Severity name 2",
  });
  await tryber.tables.WpAppqEvdSeverity.do().insert({
    id: 3,
    name: "This is the Severity name 3",
  });

  await tryber.tables.WpAppqEvdBugStatus.do().insert({
    id: 1,
    name: "This is the Status name 1",
  });
  await tryber.tables.WpAppqEvdBugStatus.do().insert({
    id: 2,
    name: "This is the Status name 2",
  });
  await tryber.tables.WpAppqEvdBugStatus.do().insert({
    id: 3,
    name: "This is the Status name 3",
  });
  await tryber.tables.WpAppqEvdBugType.do().insert({
    id: 1,
    name: "This is the Type name",
  });
  await tryber.tables.WpAppqBugTaxonomy.do().insert({
    tag_id: 1,
    bug_id: 1,
    campaign_id: 1,
    display_name: "This is the Tag name 1",
    is_public: 1,
    description: "This is the Tag description 1",
  });
  await tryber.tables.WpAppqBugTaxonomy.do().insert({
    tag_id: 2,
    bug_id: 2,
    campaign_id: 1,
    display_name: "This is the Tag name 2",
    is_public: 1,
    description: "This is the Tag description 2",
  });
  await tryber.tables.WpAppqBugTaxonomy.do().insert({
    tag_id: 3,
    bug_id: 3,
    campaign_id: 1,
    display_name: "This is the Tag name 3",
    is_public: 0,
    description: "This is the Tag description 3",
  });
});

describe("GET /campaigns/campaignId/bugs", () => {
  it("Should return 403 if logged out", async () => {
    const response = await request(app).get("/campaigns/1/bugs");
    expect(response.status).toBe(403);
  });
  it("Should return 403 if logged in", async () => {
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
    expect(response.body.items).toEqual([
      {
        id: 1,
        title: "this is title Bug 1",
        internalId: "internal_id_1",
        status: { id: 1, name: "This is the Status name 1" },
        type: { id: 1, name: "This is the Type name" },
        severity: { id: 1, name: "This is the Severity name 1" },
        tester: { id: 1, name: "John", surname: "Doe" },
      },
      {
        id: 2,
        title: "this is title Bug 2",
        internalId: "internal_id_1",
        status: { id: 2, name: "This is the Status name 2" },
        type: { id: 1, name: "This is the Type name" },
        severity: { id: 2, name: "This is the Severity name 2" },
        tester: { id: 1, name: "John", surname: "Doe" },
      },
      {
        id: 3,
        title: "this is title Bug 3",
        internalId: "internal_id_1",
        status: { id: 3, name: "This is the Status name 3" },
        type: { id: 1, name: "This is the Type name" },
        severity: { id: 3, name: "This is the Severity name 3" },
        tester: { id: 1, name: "John", surname: "Doe" },
      },
    ]);
  });

  it("Should return a bug list filtered by status 1 and 3", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?filterBy[status]=1,3")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toEqual([
      {
        id: 1,
        title: "this is title Bug 1",
        internalId: "internal_id_1",
        status: { id: 1, name: "This is the Status name 1" },
        type: { id: 1, name: "This is the Type name" },
        severity: { id: 1, name: "This is the Severity name 1" },
        tester: { id: 1, name: "John", surname: "Doe" },
      },
      {
        id: 3,
        title: "this is title Bug 3",
        internalId: "internal_id_1",
        status: { id: 3, name: "This is the Status name 3" },
        type: { id: 1, name: "This is the Type name" },
        severity: { id: 3, name: "This is the Severity name 3" },
        tester: { id: 1, name: "John", surname: "Doe" },
      },
    ]);
  });

  it("Should return a bug list filtered by severities 2 and 3", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?filterBy[severities]=2,3")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toEqual([
      {
        id: 2,
        title: "this is title Bug 2",
        internalId: "internal_id_1",
        status: { id: 2, name: "This is the Status name 2" },
        type: { id: 1, name: "This is the Type name" },
        severity: { id: 2, name: "This is the Severity name 2" },
        tester: { id: 1, name: "John", surname: "Doe" },
      },
      {
        id: 3,
        title: "this is title Bug 3",
        internalId: "internal_id_1",
        status: { id: 3, name: "This is the Status name 3" },
        type: { id: 1, name: "This is the Type name" },
        severity: { id: 3, name: "This is the Severity name 3" },
        tester: { id: 1, name: "John", surname: "Doe" },
      },
    ]);
  });

  it("Should return a bug list filtered by tags 1 and 3", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?filterBy[tags]=1,3")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toEqual([
      {
        id: 1,
        title: "this is title Bug 1",
        internalId: "internal_id_1",
        status: { id: 1, name: "This is the Status name 1" },
        type: { id: 1, name: "This is the Type name" },
        severity: { id: 1, name: "This is the Severity name 1" },
        tester: { id: 1, name: "John", surname: "Doe" },
      },
    ]);
  });
});
