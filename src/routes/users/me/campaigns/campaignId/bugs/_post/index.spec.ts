import { data as bugData } from "@src/__mocks__/mockedDb/bug";
import AdditionalReplicability from "@src/__mocks__/mockedDb/bugAdditionalReplicabilities";
import AdditionalSeverity from "@src/__mocks__/mockedDb/bugAdditionalSeverities";
import AdditionalBugType from "@src/__mocks__/mockedDb/bugAdditionalTypes";
import { data as additionalFieldsData } from "@src/__mocks__/mockedDb/bugHasAdditionalFields";
import bugMedia from "@src/__mocks__/mockedDb/bugMedia";
import Replicability from "@src/__mocks__/mockedDb/bugReplicabilities";
import Severity from "@src/__mocks__/mockedDb/bugSeverities";
import BugType from "@src/__mocks__/mockedDb/bugTypes";
import Campaign from "@src/__mocks__/mockedDb/campaign";
import CampaignAdditionals from "@src/__mocks__/mockedDb/campaignAdditionals";
import Candidature from "@src/__mocks__/mockedDb/cpHasCandidates";
import DeviceOs from "@src/__mocks__/mockedDb/deviceOs";
import DevicePlatform from "@src/__mocks__/mockedDb/devicePlatform";
import { data as profileData } from "@src/__mocks__/mockedDb/profile";
import TesterDevice from "@src/__mocks__/mockedDb/testerDevice";
import Usecases from "@src/__mocks__/mockedDb/usecases";
import UsecaseGroups from "@src/__mocks__/mockedDb/usecasesGroups";
import { data as wpUserData } from "@src/__mocks__/mockedDb/wp_users";
import app from "@src/app";
import getMimetypeFromS3 from "@src/features/getMimetypeFromS3";
import sqlite3 from "@src/features/sqlite";
import request from "supertest";

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

beforeAll(async () => {
  await wpUserData.basicUser();
  await profileData.basicTester();

  await Campaign.insert({
    id: 1,
    base_bug_internal_id: "BASE1BUGINTERNAL",
  });
  await Candidature.insert({
    selected_device: 1,
    accepted: 1,
    campaign_id: 1,
  });
  await Usecases.insert({ id: 1, title: "Title of usecase1", campaign_id: 1 });
  await UsecaseGroups.insert({ task_id: 1, group_id: 1 });
  await Usecases.insert({ id: 2, campaign_id: 1 });

  await Campaign.insert({ id: 2 });

  await Campaign.insert({ id: 3, base_bug_internal_id: "BASE3BUGINTERNAL" });
  await Candidature.insert({
    selected_device: 0,
    accepted: 1,
    campaign_id: 3,
    group_id: 1,
  });
  await Usecases.insert({ id: 4, campaign_id: 3 });
  await Usecases.insert({ id: 5, campaign_id: 3, group_id: 1 });
  await UsecaseGroups.insert({ task_id: 5, group_id: 1 });

  await Campaign.insert({
    id: 4,
    base_bug_internal_id: "BASE4BUGINTERNAL",
  });
  await Usecases.insert({ id: 3, campaign_id: 4 });
  await UsecaseGroups.insert({ task_id: 3, group_id: 1 });
  await Usecases.insert({ id: 6, campaign_id: 4 });
  await UsecaseGroups.insert({ task_id: 6, group_id: 2 });
  await Usecases.insert({ id: 7, campaign_id: 4 });
  await UsecaseGroups.insert({ task_id: 7, group_id: 0 });

  await Candidature.insert({
    selected_device: 0,
    accepted: 1,
    campaign_id: 4,
    group_id: 1,
  });
});

afterAll(async () => {
  await Candidature.clear();
  await Campaign.clear();
  await wpUserData.drop();
  await profileData.drop();

  await Usecases.clear();
  await UsecaseGroups.clear();
});

jest.mock("@src/features/getMimetypeFromS3");
(getMimetypeFromS3 as jest.Mock).mockReturnValue("image");

describe("Route POST a bug to a specific campaign", () => {
  beforeEach(async () => {
    await Severity.insert({ name: "LOW" });
    await Severity.insert({ id: 2, name: "HIGH" });
    await Replicability.insert({ name: "Once" });
    await Replicability.insert({ id: 2, name: "Sometimes" });
    await BugType.insert({ name: "Crash" });
    await BugType.insert({ id: 2, name: "Typo" });
    await BugType.insert({ id: 3, name: "Other", is_enabled: 0 });
    await DevicePlatform.insert({ name: "Android" });
    await DeviceOs.insert({
      id: 798,
      version_number: "11",
      display_name: "11",
    });
    await TesterDevice.insert({
      enabled: 1,
      id_profile: 1,
      manufacturer: "Acer",
      model: "Iconia A1",
      platform_id: 1,
      os_version_id: 798,
      form_factor: "Tablet",
      source_id: 950,
    });
    await TesterDevice.insert({
      enabled: 1,
      id_profile: 1,
      id: 2,
      manufacturer: "Acer",
      model: "Iconia A1",
      platform_id: 1,
      os_version_id: 798,
      form_factor: "Tablet",
      source_id: 950,
    });
    await TesterDevice.insert({
      enabled: 1,
      id_profile: 1,
      id: 3,
      manufacturer: "Acer",
      model: "Iconia A1",
      platform_id: 1,
      os_version_id: 798,
      form_factor: "PC",
      source_id: 950,
      pc_type: "Notebook",
    });
    await CampaignAdditionals.insert({
      slug: "codice-cliente",
      type: "regex",
      validation: "^[0-9a-zA-Z]+$",
    });
    await CampaignAdditionals.insert({
      id: 2,
      slug: "nome-banca",
      type: "select",
      validation: "intesa; etruria; sanpaolo",
    });
  });
  afterEach(async () => {
    await Severity.clear();
    await AdditionalSeverity.clear();
    await Replicability.clear();
    await AdditionalReplicability.clear();
    await BugType.clear();
    await AdditionalBugType.clear();
    await bugData.drop();
    await bugMedia.clear();
    await DevicePlatform.clear();
    await TesterDevice.clear();
    await DeviceOs.clear();
    await CampaignAdditionals.clear();
    await additionalFieldsData.drop();
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
      id: 0,
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
      id: 0,
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
      id: 0,
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
      id: 0,
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
  //
  it("Should answer 403 if a user sends a bug with a device that's not the candidate one", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send({ ...bug, device: 2 });
    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      element: "bugs",
      id: 0,
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
    expect(response.body).toHaveProperty("id", 1);
  });
  it("Should serialize device data on the bug on success", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id", 1);
    const bugData = await sqlite3.get(
      `SELECT manufacturer,model,os,os_version FROM wp_appq_evd_bug WHERE id = ${response.body.id}`
    );
    expect(bugData).toEqual({
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
    expect(response.body).toHaveProperty("id", 1);
    const bugData = await sqlite3.get(
      `SELECT manufacturer,model,os,os_version FROM wp_appq_evd_bug WHERE id = ${response.body.id}`
    );
    expect(bugData).toEqual({
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
    const baseInternal = await sqlite3.get(
      `SELECT internal_id FROM wp_appq_evd_bug WHERE id = 1`
    );
    expect(response.status).toBe(200);
    expect(baseInternal.internal_id).toEqual("BASE1BUGINTERNAL1");
  });
  it("Should update LASTSEEN if a user sends a valid bug", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    console.log(response.body);
    const insertedLastSeen = await sqlite3.get(
      `SELECT last_seen FROM wp_appq_evd_bug WHERE id = 1`
    );
    expect(response.status).toBe(200);
    expect(insertedLastSeen.last_seen).toEqual("2022-07-01T13:44:00.000+02:00");
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
  beforeEach(async () => {
    await Severity.insert({ id: 1, name: "LOW" });
    await Severity.insert({ id: 2, name: "HIGH" });
    await AdditionalSeverity.insert({ bug_severity_id: 1, campaign_id: 1 });
    await Replicability.insert({ name: "Once" });
    await BugType.insert({ name: "Crash" });
    await BugType.insert({ id: 2, name: "Typo" });
    await BugType.insert({ id: 3, name: "Other", is_enabled: 0 });
    await AdditionalBugType.insert({ campaign_id: 1 });
    await AdditionalBugType.insert({
      id: 2,
      campaign_id: 1,
      bug_type_id: 3,
    });
    await DevicePlatform.insert({ name: "Android" });
    await DeviceOs.insert({
      id: 798,
      version_number: "11",
      display_name: "11",
    });
    await TesterDevice.insert({
      enabled: 1,
      id_profile: 1,
      manufacturer: "Acer",
      model: "Iconia A1",
      platform_id: 1,
      os_version_id: 798,
      form_factor: "Tablet",
      source_id: 950,
    });
  });
  afterEach(async () => {
    await Severity.clear();
    await AdditionalSeverity.clear();
    await Replicability.clear();
    await AdditionalReplicability.clear();
    await BugType.clear();
    await AdditionalBugType.clear();
    await bugData.drop();
    await bugMedia.clear();
    await DevicePlatform.clear();
    await DeviceOs.clear();
    await TesterDevice.clear();
    await CampaignAdditionals.clear();
    await additionalFieldsData.drop();
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
      id: 0,
      message: `BugType TYPO is not accepted from CP1.`,
    });
  });
});

describe("Route POST a bug to a specific campaign - with custom severities", () => {
  beforeEach(async () => {
    await Severity.insert({ name: "LOW" });
    await Severity.insert({ id: 2, name: "HIGH" });
    await AdditionalSeverity.insert({ campaign_id: 1 });
    await Replicability.insert({ name: "Once" });
    await BugType.insert({ name: "Crash" });
    await DevicePlatform.insert({ name: "Android" });
    await DeviceOs.insert({
      id: 798,
      version_number: "11",
      display_name: "11",
    });
    await TesterDevice.insert({
      enabled: 1,
      id_profile: 1,
      manufacturer: "Acer",
      model: "Iconia A1",
      platform_id: 1,
      os_version_id: 798,
      form_factor: "Tablet",
      source_id: 950,
    });
  });
  afterEach(async () => {
    await Severity.clear();
    await AdditionalSeverity.clear();
    await Replicability.clear();
    await AdditionalReplicability.clear();
    await BugType.clear();
    await AdditionalBugType.clear();
    await bugData.drop();
    await bugMedia.clear();
    await DevicePlatform.clear();
    await DeviceOs.clear();
    await TesterDevice.clear();
    await CampaignAdditionals.clear();
    await additionalFieldsData.drop();
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
      id: 0,
      message: `Severity ${bugBadSeverity.severity} is not accepted from CP1.`,
    });
  });
});

describe("Route POST a bug to a specific campaign - with custom replicability", () => {
  beforeEach(async () => {
    await Severity.insert({ name: "LOW" });
    await Replicability.insert({ name: "Once" });
    await Replicability.insert({ id: 2, name: "Sometimes" });
    await AdditionalReplicability.insert({ campaign_id: 1 });
    await BugType.insert({ name: "Crash" });
    await DevicePlatform.insert({ name: "Android" });
    await DeviceOs.insert({
      id: 798,
      version_number: "11",
      display_name: "11",
    });
    await TesterDevice.insert({
      enabled: 1,
      id_profile: 1,
      manufacturer: "Acer",
      model: "Iconia A1",
      platform_id: 1,
      os_version_id: 798,
      form_factor: "Tablet",
      source_id: 950,
    });
  });
  afterEach(async () => {
    await Severity.clear();
    await AdditionalSeverity.clear();
    await Replicability.clear();
    await AdditionalReplicability.clear();
    await BugType.clear();
    await AdditionalBugType.clear();
    await bugData.drop();
    await bugMedia.clear();
    await DevicePlatform.clear();
    await DeviceOs.clear();
    await TesterDevice.clear();
    await CampaignAdditionals.clear();
    await additionalFieldsData.drop();
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
      id: 0,
      message: `Replicability ${bugBadReplicability.replicability} is not accepted from CP1.`,
    });
  });
});
describe("Route POST a bug to a specific campaign - with user has not devices", () => {
  beforeEach(async () => {
    await Severity.insert({ name: "LOW" });
    await Replicability.insert({ name: "Once" });
    await Replicability.insert({ id: 2, name: "Sometimes" });
    await AdditionalReplicability.insert({ campaign_id: 1 });
    await BugType.insert({ name: "Crash" });
  });
  afterEach(async () => {
    await Severity.clear();
    await AdditionalSeverity.clear();
    await Replicability.clear();
    await AdditionalReplicability.clear();
    await BugType.clear();
    await AdditionalBugType.clear();
    await bugData.drop();
    await bugMedia.clear();
    await TesterDevice.clear();
    await CampaignAdditionals.clear();
    await additionalFieldsData.drop();
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
  beforeEach(async () => {
    await Severity.insert({ name: "LOW" });
    await Severity.insert({ id: 2, name: "HIGH" });
    await Replicability.insert({ name: "Once" });
    await Replicability.insert({ id: 2, name: "Sometimes" });
    await BugType.insert({ name: "Crash" });
    await BugType.insert({ id: 2, name: "Typo" });
    await BugType.insert({ id: 3, name: "Other", is_enabled: 0 });
    await UsecaseGroups.insert();
    await DevicePlatform.insert({ name: "Android" });
    await DeviceOs.insert({
      id: 798,
      version_number: "11",
      display_name: "11",
    });
    await TesterDevice.insert({
      enabled: 1,
      id_profile: 1,
      manufacturer: "Acer",
      model: "Iconia A1",
      platform_id: 1,
      os_version_id: 798,
      form_factor: "Tablet",
      source_id: 950,
    });
    await CampaignAdditionals.insert({
      slug: "codice-cliente",
      type: "regex",
      validation: "^[0-9a-zA-Z]+$",
    });
    await CampaignAdditionals.insert({
      id: 2,
      slug: "nome-banca",
      type: "select",
      validation: "intesa; etruria; sanpaolo",
    });
  });
  afterEach(async () => {
    await Severity.clear();
    await AdditionalSeverity.clear();
    await Replicability.clear();
    await AdditionalReplicability.clear();
    await BugType.clear();
    await AdditionalBugType.clear();
    await bugData.drop();
    await bugMedia.clear();
    await TesterDevice.clear();
    await DevicePlatform.clear();
    await DeviceOs.clear();
    await CampaignAdditionals.clear();
    await additionalFieldsData.drop();
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
    console.log(response.body);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("additional");
    expect(response.body.additional).toMatchObject([
      { slug: "codice-cliente", value: "google" },
    ]);
  });
});
