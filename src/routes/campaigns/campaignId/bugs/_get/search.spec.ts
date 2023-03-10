import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";

beforeAll(async () => {
  await tryber.tables.WpAppqEvdProfile.do().insert([
    {
      id: 1,
      name: "John",
      surname: "Doe",
      wp_user_id: 1,
      email: "",
      employment_id: 1,
      education_id: 1,
    },
    {
      id: 222,
      name: "John",
      surname: "Doe",
      wp_user_id: 222,
      email: "",
      employment_id: 1,
      education_id: 1,
    },
  ]);
  await tryber.tables.WpUsers.do().insert([{ ID: 1 }, { ID: 222 }]);
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
      id: 4,
      campaign_id: 1,
      status_id: 1,
      wp_user_id: 1,
      reviewer: 1,
      last_editor_id: 1,
      severity_id: 1,
      bug_replicability_id: 1,
      bug_type_id: 1,
      internal_id: "internal_id_1",
      message: "this is title Bug_4 keyword",
    },
    {
      id: 5,
      campaign_id: 1,
      status_id: 1,
      wp_user_id: 222,
      reviewer: 1,
      last_editor_id: 1,
      severity_id: 1,
      bug_replicability_id: 1,
      bug_type_id: 1,
      internal_id: "internal_id_1",
      message: "this is title Bug five",
      is_favorite: 1,
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
    name: "This is the Type name 1",
  });
  await tryber.tables.WpAppqBugTaxonomy.do().insert([
    {
      tag_id: 1,
      bug_id: 1,
      campaign_id: 1,
      display_name: "This is the Tag name 1",
      is_public: 1,
      description: "This is the Tag description 1",
    },
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

describe("GET /campaigns/campaignId/bugs", () => {
  it("Should return a bug list filtered by search keyword in bug title", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?search=keyword")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 4,
        }),
      ])
    );
  });

  it("Should return a bug list filtered by search keyword in tag title", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?search=Tag_name_2")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 2,
        }),
      ])
    );
  });

  it("Should return a bug list filtered by search keyword in bugId", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?search=5")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 5,
        }),
      ])
    );
  });
  it("Should search favorite bugs with *", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?search=*")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 5,
        }),
      ])
    );
  });
  it("Should search bugs with TesterID", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?search=T222")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 5,
        }),
      ])
    );
    expect(response.body.items.length).toEqual(1);
  });
});
