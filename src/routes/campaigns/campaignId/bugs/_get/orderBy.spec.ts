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
      id: 2,
      name: "Johny",
      surname: "Dolly",
      wp_user_id: 2,
      email: "",
      employment_id: 1,
      education_id: 1,
    },
    {
      id: 3,
      name: "Johns",
      surname: "Snows",
      wp_user_id: 3,
      email: "",
      employment_id: 1,
      education_id: 1,
    },
  ]);
  await tryber.tables.WpUsers.do().insert([{ ID: 1 }, { ID: 2 }, { ID: 3 }]);
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
      status_id: 3,
      wp_user_id: 3,
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
      severity_id: 3,
      bug_replicability_id: 1,
      bug_type_id: 2,
      internal_id: "internal_id_1",
      message: "this is title Bug 2",
    },
    {
      id: 3,
      campaign_id: 1,
      status_id: 1,
      wp_user_id: 2,
      reviewer: 1,
      last_editor_id: 1,
      severity_id: 2,
      bug_replicability_id: 1,
      bug_type_id: 3,
      internal_id: "internal_id_1",
      message: "this is title Bug 3",
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
});

describe("GET /campaigns/campaignId/bugs - orderBy", () => {
  it("Should return a bug list ordered by bugId DESC as default", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs")
      .set("Authorization", "Bearer admin");
    expect(response.body.items.map((bug: { id: number }) => bug.id)).toEqual([
      3, 2, 1,
    ]);
    expect(response.body.items.length).toBe(3);
  });

  it("Should return a bug list ordered by bugId ASC", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?order=ASC")
      .set("Authorization", "Bearer admin");
    expect(response.body.items.map((bug: { id: number }) => bug.id)).toEqual([
      1, 2, 3,
    ]);
    expect(response.body.items.length).toBe(3);
  });
  it("Should return a bug list ordered by severity DESC", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?orderBy=severity&order=DESC")
      .set("Authorization", "Bearer admin");
    expect(response.body.items.map((bug: { id: number }) => bug.id)).toEqual([
      2, 3, 1,
    ]);
    expect(response.body.items.length).toBe(3);
  });
  it("Should return a bug list ordered by severity ASC as default", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?orderBy=severity")
      .set("Authorization", "Bearer admin");

    expect(response.body.items.map((bug: { id: number }) => bug.id)).toEqual([
      1, 3, 2,
    ]);
    expect(response.body.items.length).toBe(3);
  });
  it("Should return a bug list ordered by status DESC", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?orderBy=status&order=DESC")
      .set("Authorization", "Bearer admin");
    expect(response.body.items.map((bug: { id: number }) => bug.id)).toEqual([
      1, 2, 3,
    ]);
    expect(response.body.items.length).toBe(3);
  });
  it("Should return a bug list ordered by status ASC as default", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?orderBy=status")
      .set("Authorization", "Bearer admin");
    expect(response.body.items.map((bug: { id: number }) => bug.id)).toEqual([
      3, 2, 1,
    ]);
    expect(response.body.items.length).toBe(3);
  });
  it("Should return a bug list ordered by testerId DESC", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?orderBy=testerId&order=DESC")
      .set("Authorization", "Bearer admin");
    expect(response.body.items.map((bug: { id: number }) => bug.id)).toEqual([
      1, 3, 2,
    ]);
    expect(response.body.items.length).toBe(3);
  });
  it("Should return a bug list ordered by testerId ASC as default", async () => {
    const response = await request(app)
      .get("/campaigns/1/bugs?orderBy=testerId")
      .set("Authorization", "Bearer admin");
    expect(response.body.items.map((bug: { id: number }) => bug.id)).toEqual([
      2, 3, 1,
    ]);
    expect(response.body.items.length).toBe(3);
  });
});
