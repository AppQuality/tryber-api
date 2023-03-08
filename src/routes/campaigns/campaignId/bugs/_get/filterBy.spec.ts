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
      status_id: 2,
      wp_user_id: 1,
      reviewer: 1,
      last_editor_id: 1,
      severity_id: 2,
      bug_replicability_id: 1,
      is_duplicated: 1,
      duplicated_of_id: 3,
      bug_type_id: 2,
      internal_id: "internal_id_1",
      message: "this is title Bug 1",
    },
    {
      id: 3,
      campaign_id: 1,
      status_id: 3,
      wp_user_id: 1,
      reviewer: 1,
      last_editor_id: 1,
      severity_id: 3,
      bug_replicability_id: 1,
      bug_type_id: 3,
      internal_id: "internal_id_1",
      message: "this is title Bug 1",
    },
  ]);

  await tryber.tables.WpAppqEvdSeverity.do().insert([
    {
      id: 1,
      name: "This is the Severity name 1",
    },
    {
      id: 2,
      name: "This is the Severity name 2",
    },
    {
      id: 3,
      name: "This is the Severity name 3",
    },
  ]);

  await tryber.tables.WpAppqEvdBugStatus.do().insert([
    {
      id: 1,
      name: "This is the Status name 1",
    },
    {
      id: 2,
      name: "This is the Status name 2",
    },
    {
      id: 3,
      name: "This is the Status name 3",
    },
  ]);
  await tryber.tables.WpAppqEvdBugType.do().insert([
    {
      id: 1,
      name: "This is the Type name 1",
    },
    {
      id: 2,
      name: "This is the Type name 2",
    },
    {
      id: 3,
      name: "This is the Type name 3",
    },
  ]);
  await tryber.tables.WpAppqBugTaxonomy.do().insert([
    {
      tag_id: 2,
      bug_id: 2,
      campaign_id: 1,
      display_name: "This is the Tag_name_2",
      is_public: 1,
      description: "This is the Tag description 2",
    },
    {
      tag_id: 3,
      bug_id: 3,
      campaign_id: 1,
      display_name: "This is the Tag name 3",
      is_public: 0,
      description: "This is the Tag description 3",
    },
  ]);
});

describe("GET /campaigns/campaignId/bugs - filterby", () => {
  it("Should return bug filtered as unique bugs", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?filterBy[duplication]=unique")
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
    expect(response.body.items.length).toEqual(1);
  });

  it("Should return bug filtered as duplicated bugs", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?filterBy[duplication]=duplicated")
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
    expect(response.body.items.length).toEqual(1);
  });

  it("Should return bug filtered as father bugs", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?filterBy[duplication]=father")
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
    expect(response.body.items.length).toEqual(1);
  });

  it("Should return bug filtered as father and unique bugs", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?filterBy[duplication]=father,unique")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          duplication: "unique",
        }),
        expect.objectContaining({
          id: 3,
          duplication: "father",
        }),
      ])
    );
    expect(response.body.items.length).toEqual(2);
  });

  it("Should return a bug list filtered by status 1 and 3", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?filterBy[status]=1,3")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
        }),
        expect.objectContaining({
          id: 3,
        }),
      ])
    );
    expect(response.body.items.length).toEqual(2);
  });

  it("Should return a bug list filtered by severities 2 and 3", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?filterBy[severities]=2,3")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 2,
        }),
        expect.objectContaining({
          id: 3,
        }),
      ])
    );
    expect(response.body.items.length).toEqual(2);
  });

  it("Should return a bug list filtered by type 1 and 2", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?filterBy[types]=2,1")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");
    console.log(response.body.items);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
        }),
        expect.objectContaining({
          id: 2,
        }),
      ])
    );
    expect(response.body.items.length).toEqual(2);
  });

  it("Should return a bug list filtered by tags 2 and 3", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?filterBy[tags]=2,3")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 2,
        }),
        expect.objectContaining({
          id: 3,
        }),
      ])
    );
    expect(response.body.items.length).toBe(2);
  });
});
