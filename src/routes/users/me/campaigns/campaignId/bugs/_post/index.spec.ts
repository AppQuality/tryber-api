import app from "@src/app";
import { tryber } from "@src/features/database";
import getMimetypeFromS3 from "@src/features/getMimetypeFromS3";
import request from "supertest";
import useBasicData from "./useBasicData";

const bug = {
  title: "Campaign Title",
  description: "Camapign Description",
  expected: "The expected to reproduce the bug",
  current: "Current case",
  severity: "LOW",
  replicability: "ONCE",
  type: "CRASH",
  notes: "The bug notes",
  lastSeen: "2022-07-01T13:44:00.000+02:00",
  usecase: 1,
  device: 1,
  media: ["www.example.com/media69.jpg", "www.example.com/media6969.jpg"],
};

const bugBadSeverity = {
  ...bug,
  severity: "HIGH",
};
const bugBadReplicability = {
  ...bug,
  replicability: "SOMETIMES",
};
const bugBadBugType = {
  ...bug,
  type: "TYPO",
};
const bugNotSpecificUsecase = {
  ...bug,
  usecase: -1,
};

jest.mock("@src/features/getMimetypeFromS3");
(getMimetypeFromS3 as jest.Mock).mockReturnValue("image");

describe("Route POST a bug to a specific campaign", () => {
  useBasicData();
  beforeEach(async () => {
    await tryber.tables.WpAppqEvdSeverity.do().insert({ id: 1, name: "LOW" });
    await tryber.tables.WpAppqEvdSeverity.do().insert({ id: 2, name: "HIGH" });
    await tryber.tables.WpAppqEvdBugReplicability.do().insert({
      id: 1,
      name: "Once",
    });
    await tryber.tables.WpAppqEvdBugReplicability.do().insert({
      id: 2,
      name: "Sometimes",
    });
    await tryber.tables.WpAppqEvdBugType.do().insert({ id: 1, name: "Crash" });
    await tryber.tables.WpAppqEvdBugType.do().insert({ id: 2, name: "Typo" });
    await tryber.tables.WpAppqEvdBugType.do().insert({
      id: 3,
      name: "Other",
      is_enabled: 0,
    });
    await tryber.tables.WpAppqEvdPlatform.do().insert({
      id: 1,
      name: "Android",
      architecture: 1,
    });
    await tryber.tables.WpAppqOs.do().insert({
      id: 798,
      version_number: "11",
      display_name: "11",
      platform_id: 1,
      main_release: 1,
      version_family: 1,
    });
    await tryber.tables.WpCrowdAppqDevice.do().insert({
      id: 1,
      enabled: 1,
      id_profile: 1,
      manufacturer: "Acer",
      model: "Iconia A1",
      platform_id: 1,
      os_version_id: 798,
      form_factor: "Tablet",
      source_id: 950,
    });
    await tryber.tables.WpCrowdAppqDevice.do().insert({
      id: 2,
      enabled: 1,
      id_profile: 1,
      manufacturer: "Acer",
      model: "Iconia A1",
      platform_id: 1,
      os_version_id: 798,
      form_factor: "Tablet",
      source_id: 950,
    });
    await tryber.tables.WpCrowdAppqDevice.do().insert({
      id: 3,
      enabled: 1,
      id_profile: 1,
      manufacturer: "Acer",
      model: "Iconia A1",
      platform_id: 1,
      os_version_id: 798,
      form_factor: "PC",
      source_id: 950,
      pc_type: "Notebook",
    });
    await tryber.tables.WpAppqCampaignAdditionalFields.do().insert({
      id: 1,
      slug: "codice-cliente",
      type: "regex",
      title: "Codice cliente",
      error_message: "",
      validation: "^[0-9a-zA-Z]+$",
      cp_id: 1,
    });
    await tryber.tables.WpAppqCampaignAdditionalFields.do().insert({
      id: 2,
      slug: "nome-banca",
      type: "select",
      validation: "intesa; etruria; sanpaolo",
      title: "Nome banca",
      error_message: "",
      cp_id: 1,
    });
  });
  afterEach(async () => {
    await tryber.tables.WpAppqEvdSeverity.do().delete();
    await tryber.tables.WpAppqEvdBugReplicability.do().delete();
    await tryber.tables.WpAppqEvdBugType.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
    await tryber.tables.WpAppqOs.do().delete();
    await tryber.tables.WpCrowdAppqDevice.do().delete();
    await tryber.tables.WpAppqAdditionalBugSeverities.do().delete();
    await tryber.tables.WpAppqAdditionalBugReplicabilities.do().delete();
    await tryber.tables.WpAppqAdditionalBugTypes.do().delete();
    await tryber.tables.WpAppqEvdBug.do().delete();
    await tryber.tables.WpAppqEvdBugMedia.do().delete();
    await tryber.tables.WpCrowdAppqDevice.do().delete();
    await tryber.tables.WpAppqCampaignAdditionalFields.do().delete();
    await tryber.tables.WpAppqCampaignAdditionalFieldsData.do().delete();
  });
  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).post("/users/me/campaigns/1/bugs");
    expect(response.status).toBe(403);
  });
  it("Should answer 404 if campaign does not exist", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/100/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      element: "bugs",
      id: 1,
      message: "CP100, does not exists.",
    });
  });
  it("Should answer 403 if user is not selected on CP", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/2/bugs")
      .set("authorization", "Bearer tester")
      .send({ ...bug });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      element: "bugs",
      id: 1,
      message: "T1 is not candidate on CP2.",
    });
  });
  it("Should answer 403 if a user sends an unaccepted usecase on CP", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send({ ...bug, usecase: 100 });
    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      element: "bugs",
      id: 1,
      message: `Usecase 100 not found for CP1.`,
    });
  });

  it("Should answer 403 if a user sends a bug to a usecase for another group", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/4/bugs")
      .set("authorization", "Bearer tester")
      .send({ ...bug, usecase: 6 });
    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      element: "bugs",
      id: 1,
      message: `Usecase 6 not found for CP4.`,
    });
  });

  it("Should answer 200 if a user sends a usecase that has all groups", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/4/bugs")
      .set("authorization", "Bearer tester")
      .send({ ...bug, usecase: 7 });
    expect(response.status).toBe(200);
  });

  it("Should answer 200 if a user sends a lastSeenDate with another timezone", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/4/bugs")
      .set("authorization", "Bearer tester")
      .send({ ...bug, lastSeen: "2023-03-16T07:56:16.000-03:00", usecase: 7 });
    expect(response.status).toBe(200);
  });
  //
  it("Should answer 403 if a user sends a bug with a device that's not the candidate one", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send({ ...bug, device: 2 });
    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      element: "bugs",
      id: 1,
      message: `Device is not candidate on CP1.`,
    });
  });
  it("Should answer 200 if user sends a bug with any device on a CP that accepts all devices", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/4/bugs")
      .set("authorization", "Bearer tester")
      .send({ ...bug, usecase: 3 });
    expect(response.status).toBe(200);
  });
  it("Should return inserted bug with testerId if a user sends a valid bug", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("testerId", 1);
  });
  it("Should insert profile_id on bug if send a valid bug", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(200);
    const bugData = await tryber.tables.WpAppqEvdBug.do()
      .select("profile_id")
      .where("id", response.body.id)
      .first();

    expect(bugData).toHaveProperty("profile_id", 1);
  });
  it("Should serialize device data on the bug on success", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id", response.body.id);
    const bugData = await tryber.tables.WpAppqEvdBug.do()
      .select("manufacturer", "model", "os", "os_version")
      .where("id", response.body.id);
    expect(bugData).toHaveLength(1);
    expect(bugData[0]).toEqual({
      manufacturer: "Acer",
      model: "Iconia A1",
      os: "Android",
      os_version: "11 (11)",
    });
  });
  it("Should serialize device data on the bug on success - pc", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/3/bugs")
      .set("authorization", "Bearer tester")
      .send({ ...bug, device: 3, usecase: 5 });
    expect(response.status).toBe(200);

    const bugData = await tryber.tables.WpAppqEvdBug.do()
      .select("manufacturer", "model", "os", "os_version")
      .where("id", response.body.id);
    expect(bugData).toHaveLength(1);
    expect(bugData[0]).toEqual({
      manufacturer: "-",
      model: "Notebook",
      os: "Android",
      os_version: "11 (11)",
    });
  });
  it("Should return inserted bug with TITLE if a user sends the bug title", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("title", bug.title);
  });
  it("Should return inserted bug with DESCRIPTION if a user sends the bug description", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("description", bug.description);
  });
  it("Should return inserted bug with NOTES if a user sends the bug notes", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("notes", bug.notes);
  });
  it("Should return inserted bug with STATUS PENDING if a user sends a valid bug", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "PENDING");
  });
  it("Should return inserted bug with USECASE if a user sends a bug with usecase value", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("usecase", "Title of usecase1");
  });
  it("Should return (USECASE = Not a specific use case)  if a user sends a usecase = -1", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bugNotSpecificUsecase);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("usecase", "Not a specific use case");
  });
  it("Should return inserted bug with EXPECTED if a user sends a bug with expected value", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "expected",
      "The expected to reproduce the bug"
    );
  });
  it("Should return inserted bug with CURRENT if a user sends a bug with current value", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("current", "Current case");
  });
  it("Should return inserted bug with SEVERITY if a user sends the bug severity", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("severity", "LOW");
  });
  it("Should return inserted bug with REPLICABILITY if a user sends the bug replicability", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("replicability", "ONCE");
  });
  it("Should return inserted bug with TYPE if a user sends the bug type", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("type", "CRASH");
  });
  it("Should update INTERNALID if a user sends a valid bug", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    const baseInternal = await tryber.tables.WpAppqEvdBug.do()
      .select("internal_id")
      .where("id", response.body.id);
    expect(baseInternal).toHaveLength(1);
    expect(response.status).toBe(200);
    expect(baseInternal[0].internal_id).toEqual(
      "BASE1BUGINTERNAL" + response.body.id
    );
  });
  it("Should return 403 if a user sends an invalid lastSeen date", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send({ ...bug, lastSeen: "THIS IS NOT AN ISOSTRING-DATE" });
    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      element: "bugs",
      id: 1,
      message: `Date format is not correct.`,
    });
  });
  it("Should update LASTSEEN if a user sends a valid bug", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    const insertedLastSeen = await tryber.tables.WpAppqEvdBug.do()
      .select("last_seen")
      .where("id", response.body.id);
    expect(response.status).toBe(200);
    expect(insertedLastSeen).toHaveLength(1);
    expect(insertedLastSeen[0].last_seen).toEqual(
      "2022-07-01T13:44:00.000+02:00"
    );
  });
  it("Should return inserted MEDIA if a user sends a bug with medias", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("media");
    expect(Array.isArray(response.body.media)).toEqual(true);
    expect(response.body.media).toEqual([
      "www.example.com/media69.jpg",
      "www.example.com/media6969.jpg",
    ]);
  });
  it("Should return DEVICE used to upload bug", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("device");
    expect(response.body.device).toMatchObject({
      device: { id: 950, manufacturer: "Acer", model: "Iconia A1" },
      id: 1,
      operating_system: { id: 798, platform: "Android", version: "11 (11)" },
      type: "Tablet",
    });
  });
  it("Should return ADDITIONAL fields if user sends a bug with additional fields", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send({
        ...bug,
        additional: [
          { slug: "codice-cliente", value: "google" },
          { slug: "nome-banca", value: "intesa" },
        ],
      });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("additional");
    expect(response.body.additional).toMatchObject([
      { slug: "codice-cliente", value: "google" },
      { slug: "nome-banca", value: "intesa" },
    ]);
  });
});

describe("Route POST a bug to a specific campaign - with custom type", () => {
  useBasicData();
  beforeEach(async () => {
    await tryber.tables.WpAppqEvdSeverity.do().insert({ id: 1, name: "LOW" });
    await tryber.tables.WpAppqEvdSeverity.do().insert({ id: 2, name: "HIGH" });
    await tryber.tables.WpAppqEvdBugReplicability.do().insert({
      id: 1,
      name: "Once",
    });
    await tryber.tables.WpAppqEvdBugType.do().insert({ id: 1, name: "Crash" });
    await tryber.tables.WpAppqEvdBugType.do().insert({ id: 2, name: "Typo" });
    await tryber.tables.WpAppqEvdBugType.do().insert({
      id: 3,
      name: "Other",
      is_enabled: 0,
    });

    await tryber.tables.WpAppqEvdPlatform.do().insert({
      id: 1,
      name: "Android",
      architecture: 1,
    });
    await tryber.tables.WpAppqOs.do().insert({
      id: 798,
      version_number: "11",
      display_name: "11",
      platform_id: 1,
      main_release: 1,
      version_family: 1,
    });

    await tryber.tables.WpCrowdAppqDevice.do().insert({
      id: 1,
      enabled: 1,
      id_profile: 1,
      manufacturer: "Acer",
      model: "Iconia A1",
      platform_id: 1,
      os_version_id: 798,
      form_factor: "Tablet",
      source_id: 950,
    });

    await tryber.tables.WpAppqAdditionalBugSeverities.do().insert({
      bug_severity_id: 1,
      campaign_id: 1,
    });

    await tryber.tables.WpAppqAdditionalBugTypes.do().insert({
      bug_type_id: 1,
      campaign_id: 1,
    });
    await tryber.tables.WpAppqAdditionalBugTypes.do().insert({
      bug_type_id: 3,
      campaign_id: 1,
    });
  });
  afterEach(async () => {
    await tryber.tables.WpAppqEvdSeverity.do().delete();
    await tryber.tables.WpAppqEvdBugReplicability.do().delete();
    await tryber.tables.WpAppqEvdBugType.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
    await tryber.tables.WpAppqOs.do().delete();
    await tryber.tables.WpCrowdAppqDevice.do().delete();
    await tryber.tables.WpAppqAdditionalBugSeverities.do().delete();
    await tryber.tables.WpAppqAdditionalBugReplicabilities.do().delete();
    await tryber.tables.WpAppqAdditionalBugTypes.do().delete();
    await tryber.tables.WpAppqEvdBug.do().delete();
    await tryber.tables.WpAppqEvdBugMedia.do().delete();
    await tryber.tables.WpCrowdAppqDevice.do().delete();
    await tryber.tables.WpAppqCampaignAdditionalFields.do().delete();
    await tryber.tables.WpAppqCampaignAdditionalFieldsData.do().delete();
    await tryber.tables.WpAppqAdditionalBugTypes.do().delete();
    await tryber.tables.WpAppqAdditionalBugSeverities.do().delete();
  });
  it("Should return inserted bug with TYPE if a user sends the bug type", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("type", "CRASH");
  });
  it("Should answer 403 if a user sends a unaccepted bug-type on CP", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bugBadBugType);
    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      element: "bugs",
      id: 1,
      message: `BugType TYPO is not accepted from CP1.`,
    });
  });
});

describe("Route POST a bug to a specific campaign - with custom severities", () => {
  useBasicData();
  beforeEach(async () => {
    await tryber.tables.WpAppqEvdSeverity.do().insert({ id: 1, name: "LOW" });
    await tryber.tables.WpAppqEvdSeverity.do().insert({ id: 2, name: "HIGH" });
    await tryber.tables.WpAppqEvdBugReplicability.do().insert({
      id: 1,
      name: "Once",
    });
    await tryber.tables.WpAppqEvdBugType.do().insert({ id: 1, name: "Crash" });
    await tryber.tables.WpAppqEvdPlatform.do().insert({
      id: 1,
      name: "Android",
      architecture: 1,
    });
    await tryber.tables.WpAppqOs.do().insert({
      id: 798,
      version_number: "11",
      display_name: "11",
      platform_id: 1,
      main_release: 1,
      version_family: 1,
    });
    await tryber.tables.WpCrowdAppqDevice.do().insert({
      id: 1,
      enabled: 1,
      id_profile: 1,
      manufacturer: "Acer",
      model: "Iconia A1",
      platform_id: 1,
      os_version_id: 798,
      form_factor: "Tablet",
      source_id: 950,
    });

    await tryber.tables.WpAppqAdditionalBugSeverities.do().insert({
      bug_severity_id: 1,
      campaign_id: 1,
    });
  });
  afterEach(async () => {
    await tryber.tables.WpAppqEvdSeverity.do().delete();
    await tryber.tables.WpAppqEvdBugReplicability.do().delete();
    await tryber.tables.WpAppqEvdBugType.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
    await tryber.tables.WpAppqOs.do().delete();
    await tryber.tables.WpCrowdAppqDevice.do().delete();
    await tryber.tables.WpAppqAdditionalBugSeverities.do().delete();
    await tryber.tables.WpAppqAdditionalBugReplicabilities.do().delete();
    await tryber.tables.WpAppqAdditionalBugTypes.do().delete();
    await tryber.tables.WpAppqEvdBug.do().delete();
    await tryber.tables.WpAppqEvdBugMedia.do().delete();
    await tryber.tables.WpCrowdAppqDevice.do().delete();
    await tryber.tables.WpAppqCampaignAdditionalFields.do().delete();
    await tryber.tables.WpAppqCampaignAdditionalFieldsData.do().delete();
    await tryber.tables.WpAppqAdditionalBugTypes.do().delete();
    await tryber.tables.WpAppqAdditionalBugSeverities.do().delete();
  });
  it("Should return inserted bug with SEVERITY if a user sends the bug severity", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("severity", "LOW");
  });
  it("Should answer 403 if a user sends an unaccepted severity on CP", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bugBadSeverity);
    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      element: "bugs",
      id: 1,
      message: `Severity ${bugBadSeverity.severity} is not accepted from CP1.`,
    });
  });
});

describe("Route POST a bug to a specific campaign - with custom replicability", () => {
  useBasicData();
  beforeEach(async () => {
    await tryber.tables.WpAppqEvdSeverity.do().insert({ id: 1, name: "LOW" });
    await tryber.tables.WpAppqEvdBugReplicability.do().insert({
      id: 1,
      name: "Once",
    });
    await tryber.tables.WpAppqEvdBugReplicability.do().insert({
      id: 2,
      name: "Sometimes",
    });
    await tryber.tables.WpAppqEvdBugType.do().insert({ id: 1, name: "Crash" });
    await tryber.tables.WpAppqEvdPlatform.do().insert({
      id: 1,
      name: "Android",
      architecture: 1,
    });
    await tryber.tables.WpAppqOs.do().insert({
      id: 798,
      version_number: "11",
      display_name: "11",
      platform_id: 1,
      main_release: 1,
      version_family: 1,
    });
    await tryber.tables.WpCrowdAppqDevice.do().insert({
      id: 1,
      enabled: 1,
      id_profile: 1,
      manufacturer: "Acer",
      model: "Iconia A1",
      platform_id: 1,
      os_version_id: 798,
      form_factor: "Tablet",
      source_id: 950,
    });

    await tryber.tables.WpAppqAdditionalBugReplicabilities.do().insert({
      bug_replicability_id: 1,
      campaign_id: 1,
    });
  });
  afterEach(async () => {
    await tryber.tables.WpAppqEvdSeverity.do().delete();
    await tryber.tables.WpAppqEvdBugReplicability.do().delete();
    await tryber.tables.WpAppqEvdBugType.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
    await tryber.tables.WpAppqOs.do().delete();
    await tryber.tables.WpCrowdAppqDevice.do().delete();
    await tryber.tables.WpAppqAdditionalBugSeverities.do().delete();
    await tryber.tables.WpAppqAdditionalBugReplicabilities.do().delete();
    await tryber.tables.WpAppqAdditionalBugTypes.do().delete();
    await tryber.tables.WpAppqEvdBug.do().delete();
    await tryber.tables.WpAppqEvdBugMedia.do().delete();
    await tryber.tables.WpCrowdAppqDevice.do().delete();
    await tryber.tables.WpAppqCampaignAdditionalFields.do().delete();
    await tryber.tables.WpAppqCampaignAdditionalFieldsData.do().delete();
    await tryber.tables.WpAppqAdditionalBugTypes.do().delete();
    await tryber.tables.WpAppqAdditionalBugSeverities.do().delete();
  });

  it("Should return inserted bug with REPLICABILITY if a user sends the bug replicability", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("replicability", "ONCE");
  });
  it("Should answer 403 if a user sends a unaccepted replicability on CP", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bugBadReplicability);
    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      element: "bugs",
      id: 1,
      message: `Replicability ${bugBadReplicability.replicability} is not accepted from CP1.`,
    });
  });
});
describe("Route POST a bug to a specific campaign - with user has not devices", () => {
  useBasicData();
  beforeEach(async () => {
    await tryber.tables.WpAppqEvdSeverity.do().insert({ id: 1, name: "LOW" });
    await tryber.tables.WpAppqEvdBugReplicability.do().insert({
      id: 1,
      name: "Once",
    });
    await tryber.tables.WpAppqEvdBugReplicability.do().insert({
      id: 2,
      name: "Sometimes",
    });
    await tryber.tables.WpAppqEvdBugType.do().insert({ id: 1, name: "Crash" });
  });
  afterEach(async () => {
    await tryber.tables.WpAppqEvdSeverity.do().delete();
    await tryber.tables.WpAppqEvdBugReplicability.do().delete();
    await tryber.tables.WpAppqEvdBugType.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
    await tryber.tables.WpAppqOs.do().delete();
    await tryber.tables.WpCrowdAppqDevice.do().delete();
    await tryber.tables.WpAppqAdditionalBugSeverities.do().delete();
    await tryber.tables.WpAppqAdditionalBugReplicabilities.do().delete();
    await tryber.tables.WpAppqAdditionalBugTypes.do().delete();
    await tryber.tables.WpAppqEvdBug.do().delete();
    await tryber.tables.WpAppqEvdBugMedia.do().delete();
    await tryber.tables.WpCrowdAppqDevice.do().delete();
    await tryber.tables.WpAppqCampaignAdditionalFields.do().delete();
    await tryber.tables.WpAppqCampaignAdditionalFieldsData.do().delete();
    await tryber.tables.WpAppqAdditionalBugTypes.do().delete();
    await tryber.tables.WpAppqAdditionalBugSeverities.do().delete();
  });

  it("Should return 403 if a user has no device", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(403);
  });
});

describe("Route POST a bug to a specific campaign - with invalid additional fields", () => {
  useBasicData();
  beforeEach(async () => {
    await tryber.tables.WpAppqEvdSeverity.do().insert({ id: 1, name: "LOW" });
    await tryber.tables.WpAppqEvdSeverity.do().insert({ id: 2, name: "HIGH" });
    await tryber.tables.WpAppqEvdBugReplicability.do().insert({
      id: 1,
      name: "Once",
    });
    await tryber.tables.WpAppqEvdBugReplicability.do().insert({
      id: 2,
      name: "Sometimes",
    });
    await tryber.tables.WpAppqEvdBugType.do().insert({ id: 1, name: "Crash" });
    await tryber.tables.WpAppqEvdBugType.do().insert({ id: 2, name: "Typo" });
    await tryber.tables.WpAppqEvdBugType.do().insert({
      id: 3,
      name: "Other",
      is_enabled: 0,
    });

    await tryber.tables.WpAppqEvdPlatform.do().insert({
      id: 1,
      name: "Android",
      architecture: 1,
    });
    await tryber.tables.WpAppqOs.do().insert({
      id: 798,
      version_number: "11",
      display_name: "11",
      platform_id: 1,
      main_release: 1,
      version_family: 1,
    });
    await tryber.tables.WpCrowdAppqDevice.do().insert({
      id: 1,
      enabled: 1,
      id_profile: 1,
      manufacturer: "Acer",
      model: "Iconia A1",
      platform_id: 1,
      os_version_id: 798,
      form_factor: "Tablet",
      source_id: 950,
    });

    await tryber.tables.WpAppqCampaignAdditionalFields.do().insert({
      id: 1,
      slug: "codice-cliente",
      type: "regex",
      title: "Codice cliente",
      error_message: "",
      validation: "^[0-9a-zA-Z]+$",
      cp_id: 1,
    });
    await tryber.tables.WpAppqCampaignAdditionalFields.do().insert({
      id: 2,
      slug: "nome-banca",
      type: "select",
      validation: "intesa; etruria; sanpaolo",
      title: "Nome banca",
      error_message: "",
      cp_id: 1,
    });
  });
  afterEach(async () => {
    await tryber.tables.WpAppqEvdSeverity.do().delete();
    await tryber.tables.WpAppqEvdBugReplicability.do().delete();
    await tryber.tables.WpAppqEvdBugType.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
    await tryber.tables.WpAppqOs.do().delete();
    await tryber.tables.WpCrowdAppqDevice.do().delete();
    await tryber.tables.WpAppqAdditionalBugSeverities.do().delete();
    await tryber.tables.WpAppqAdditionalBugReplicabilities.do().delete();
    await tryber.tables.WpAppqAdditionalBugTypes.do().delete();
    await tryber.tables.WpAppqEvdBug.do().delete();
    await tryber.tables.WpAppqEvdBugMedia.do().delete();
    await tryber.tables.WpCrowdAppqDevice.do().delete();
    await tryber.tables.WpAppqCampaignAdditionalFields.do().delete();
    await tryber.tables.WpAppqCampaignAdditionalFieldsData.do().delete();
    await tryber.tables.WpAppqAdditionalBugTypes.do().delete();
    await tryber.tables.WpAppqAdditionalBugSeverities.do().delete();
  });

  it("Should return inserted bug without additional if a user send invalid additional fields", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send({
        ...bug,
        additional: [{ slug: "browser", value: "Chrome" }],
      });
    expect(response.status).toBe(200);
    expect(response.body.additional).toBe(undefined);
  });
  it("Should return inserted with accpted additional fields if a user sends partially invalid additional fields ", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send({
        ...bug,
        additional: [
          { slug: "browser", value: "Chrome" },
          { slug: "codice-cliente", value: "google" },
          { slug: "nome-banca", value: "intendiamoci" },
        ],
      });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("additional");
    expect(response.body.additional).toMatchObject([
      { slug: "codice-cliente", value: "google" },
    ]);
  });
  it("Should create with application_section_id 0 if not a specific usecase is selected", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send({
        ...bug,
        usecase: -1,
      });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("usecase", "Not a specific use case");
    expect(response.body).toHaveProperty("id");
    const bugData = await tryber.tables.WpAppqEvdBug.do()
      .select("application_section_id")
      .where("id", response.body.id);
    expect(bugData).toHaveLength(1);
    expect(bugData[0]).toHaveProperty("application_section_id", -1);
  });
});
