import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
import useBasicData from "./useBasicData";

describe("Route GET /users/me/campaigns/{campaignId}/", () => {
  useBasicData();

  it("Should return 403 if user is not logged in", async () => {
    const res = await request(app).get("/users/me/campaigns/1");
    expect(res.status).toBe(403);
  });
  it("Should return 404 if user is logged in but not selected", async () => {
    const res = await request(app)
      .get("/users/me/campaigns/2")
      .set("Authorization", "Bearer tester");
    expect(res.status).toBe(404);
  });
  it("Should return 200 if user is logged and selected", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should return only active and accepted bugTypes if user is logged and selected", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1")
      .set("Authorization", "Bearer tester");
    expect(response.body).toHaveProperty("bugTypes");
    expect(response.body.bugTypes).toEqual({
      valid: ["TYPO", "CRASH"],
      invalid: [],
    });
  });
  it("Should return campaign data if user is logged and selected", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1")
      .set("Authorization", "Bearer tester");
    expect(response.body).toEqual({
      id: 1,
      title: "My campaign",
      minimumMedia: 4,
      hasBugForm: true,
      bugSeverity: { valid: ["LOW", "MEDIUM"], invalid: [] },
      bugTypes: { valid: ["TYPO", "CRASH"], invalid: [] },
      bugReplicability: { valid: ["ONCE", "ALWAYS"], invalid: [] },
      useCases: [
        {
          id: 2,
          name: "First Usecase All groups",
        },
        {
          id: 1,
          name: "Second Usecase All groups",
        },
        {
          id: 3,
          name: "Third Usecase All groups",
        },
        {
          id: 4,
          name: "Fourth Usecase Group 1",
        },
        {
          id: 7,
          name: "Usecase multigroup",
        },
        {
          id: 10,
          name: "Usecase multigroup all groups",
        },
        {
          id: -1,
          name: "Not a specific usecase",
        },
      ],
      validFileExtensions: [".jpg", ".png", ".gif"],
      end_date: "2020-12-31 23:59:59",
      goal: "Example: goal of the campaign",
      icon: "bug-report",
      campaign_type: {
        name: "Bug Hunting",
        id: 1,
      },
      acceptedDevices: {},
    });
  });
});

describe("Route GET /users/me/campaigns/{campaignId}/ - custom severities set for a specific CP", () => {
  useBasicData();
  beforeAll(async () => {
    await tryber.tables.WpAppqAdditionalBugSeverities.do().insert([
      {
        campaign_id: 2,
        bug_severity_id: 3,
      },
      {
        campaign_id: 1,
        bug_severity_id: 1,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqAdditionalBugSeverities.do().delete();
  });
  it("Should return only selected severities", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1")
      .set("Authorization", "Bearer tester");
    expect(response.body).toMatchObject({
      bugSeverity: { valid: ["LOW"], invalid: ["MEDIUM"] },
    });
  });
});

describe("Route GET /users/me/campaigns/{campaignId}/ - custom bug types set for a specific CP", () => {
  useBasicData();
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdBugType.do().insert([
      { id: 30, name: "Corrupted", is_enabled: 1 },
      { id: 40, name: "Persistent", is_enabled: 0 },
    ]);

    await tryber.tables.WpAppqAdditionalBugTypes.do().insert([
      {
        campaign_id: 2,
        bug_type_id: 2, // Crash - enabled
      },
      {
        campaign_id: 1,
        bug_type_id: 1, // Typo - enabled
      },
      {
        campaign_id: 1,
        bug_type_id: 3, // Atomic - disabled
      },
      {
        campaign_id: 1,
        bug_type_id: 30, // Corrupted - enabled
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqAdditionalBugTypes.do().delete();
  });
  it("Should return only selected bug types", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1")
      .set("Authorization", "Bearer tester");
    expect(response.body).toMatchObject({
      bugTypes: { valid: ["TYPO", "ATOMIC", "CORRUPTED"], invalid: ["CRASH"] },
    });
  });
  it("Should return selected bug types also if type are disabled", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1")
      .set("Authorization", "Bearer tester");
    expect(response.body).toMatchObject({
      bugTypes: {
        valid: expect.arrayContaining(["ATOMIC"]),
      },
    });
  });
  it("Should return not-standard (enabled  and disabled) custom bug TYPE as valid", async () => {
    // insert not-standard bug type
    // standard bug type: CRASH, GRAPHIC, MALFUNCTION, OTHER, PERFORMANCE, SECURITY, TYPO, USABILITY
    const standard = [
      "CRASH",
      "GRAPHIC",
      "MALFUNCTION",
      "OTHER",
      "PERFORMANCE",
      "SECURITY",
      "TYPO",
      "USABILITY",
    ];
    const noStandardCustomTypes = (
      await tryber.tables.WpAppqEvdBugType.do()
        .select("name")
        .join(
          "wp_appq_additional_bug_types",
          "wp_appq_evd_bug_type.id",
          "wp_appq_additional_bug_types.bug_type_id"
        )
        .where("wp_appq_additional_bug_types.campaign_id", 1)
    )
      .map((type) => type.name.toUpperCase())
      .filter((type) => !standard.includes(type));

    const response = await request(app)
      .get("/users/me/campaigns/1")
      .set("Authorization", "Bearer tester");
    expect(response.body).toMatchObject({
      bugTypes: {
        valid: expect.arrayContaining(noStandardCustomTypes),
      },
    });
  });
});

describe("Route GET /users/me/campaigns/{campaignId}/ - custom replicabilities set for a specific CP", () => {
  useBasicData();
  beforeAll(async () => {
    await tryber.tables.WpAppqAdditionalBugReplicabilities.do().insert([
      {
        campaign_id: 2,
        bug_replicability_id: 2,
      },
      {
        campaign_id: 1,
        bug_replicability_id: 1,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqAdditionalBugReplicabilities.do().delete();
  });
  it("Should return only selected bug types", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1")
      .set("Authorization", "Bearer tester");
    expect(response.body).toMatchObject({
      bugReplicability: { valid: ["ONCE"], invalid: ["ALWAYS"] },
    });
  });
});

describe("Route GET /users/me/campaigns/{campaignId}/ - additional fields set", () => {
  useBasicData();
  beforeAll(async () => {
    await tryber.tables.WpAppqCampaignAdditionalFields.do().insert([
      {
        id: 1,
        cp_id: 1,
        slug: "browser",
        title: "Browser",
        type: "select",
        validation: 'Chromé;Sa Fari\\"',
        error_message: "Please select the browser used",
      },
      {
        id: 2,
        cp_id: 1,
        slug: "codice-cliente",
        title: "Codice Cliente",
        type: "regex",
        validation: '^[A-Z]{3}[0-9]{4}"\\$',
        error_message: "Inserisci un codice cliente valido (es. ABC1234)",
      },
      {
        id: 3,
        cp_id: 2,
        slug: "altra-cp",
        title: "Altra CP",
        type: "regex",
        validation: "",
        error_message: "",
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqCampaignAdditionalFields.do().delete();
  });
  it("Should return a list of additional fields", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1")
      .set("Authorization", "Bearer tester");
    expect(response.body).toMatchObject({
      additionalFields: [
        {
          type: "select",
          name: "Browser",
          slug: "browser",
          options: ["Chromé", 'Sa Fari\\"'],
          error: "Please select the browser used",
        },
        {
          type: "text",
          slug: "codice-cliente",
          name: "Codice Cliente",
          regex: '^[A-Z]{3}[0-9]{4}"\\$',
          error: "Inserisci un codice cliente valido (es. ABC1234)",
        },
      ],
    });
  });
});

describe("Route GET /users/me/campaigns/{campaignId}/ - bug language set", () => {
  useBasicData();
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 1,
      title: "My campaign",
      min_allowed_media: 4,
      campaign_type: 0,
      bug_lang: 1,
      platform_id: 1,
      start_date: "2020-01-01 00:00:00",
      end_date: "2020-12-31 23:59:59",
      page_preview_id: 1,
      page_manual_id: 1,
      customer_id: 1,
      pm_id: 1,
      project_id: 1,
      customer_title: "My campaign",
      phase_id: 20,
    });
    await tryber.tables.WpAppqCpMeta.do().insert([
      {
        meta_id: 1,
        campaign_id: 5,
        meta_key: "bug_lang_code",
        meta_value: "en",
      },
      {
        meta_id: 2,
        campaign_id: 5,
        meta_key: "bug_lang_message",
        meta_value: "Bug in english",
      },
      {
        meta_id: 3,
        campaign_id: 1,
        meta_key: "bug_lang_code",
        meta_value: "it",
      },
      {
        meta_id: 4,
        campaign_id: 1,
        meta_key: "bug_lang_message",
        meta_value: "Bug in italiano",
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqCpMeta.do().delete();
  });
  it("Should return a the language with a message", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1")
      .set("Authorization", "Bearer tester");
    expect(response.body).toMatchObject({
      language: {
        code: "IT",
        message: "Bug in italiano",
      },
    });
  });
});

describe("Route GET /users/me/campaigns/{campaignId}/ - title rule set", () => {
  useBasicData();
  beforeAll(async () => {
    await tryber.tables.WpAppqCpMeta.do().insert({
      meta_id: 1,
      campaign_id: 1,
      meta_key: "bug_title_rule",
      meta_value: "1",
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqCpMeta.do().delete();
  });
  it("Should return title rule = true", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1")
      .set("Authorization", "Bearer tester");
    expect(response.body).toMatchObject({
      titleRule: true,
    });
  });
});
