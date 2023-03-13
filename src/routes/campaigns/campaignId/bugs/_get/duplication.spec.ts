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
      is_duplicated: 1,
      duplicated_of_id: 3,
      bug_type_id: 1,
      internal_id: "internal_id_1",
      message: "this is title Bug 1",
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
      message: "this is title Bug 1",
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

describe("GET /campaigns/campaignId/bugs - duplication status", () => {
  it("Should return a unique bug", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          duplication: "unique",
        }),
      ])
    );
  });
  it("Should return a duplicated bug", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 2,
          duplication: "duplicated",
        }),
      ])
    );
  });
  it("Should return a father bug", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 3,
          duplication: "father",
        }),
      ])
    );
  });
});
