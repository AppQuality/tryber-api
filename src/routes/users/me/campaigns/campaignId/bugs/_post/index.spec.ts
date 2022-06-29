import { data as bugData } from "@src/__mocks__/mockedDb/bug";
import { data as additionalFieldsData } from "@src/__mocks__/mockedDb/bugHasAdditionalFields";
import bugMedia from "@src/__mocks__/mockedDb/bugMedia";
import { data as replicabilityData } from "@src/__mocks__/mockedDb/bugReplicabilities";
import { data as severityData } from "@src/__mocks__/mockedDb/bugSeverities";
import { data as bugTypesData } from "@src/__mocks__/mockedDb/bugTypes";
import { data as campaignData } from "@src/__mocks__/mockedDb/campaign";
import { data as additionalFields } from "@src/__mocks__/mockedDb/cpHasAdditionalFields";
import { data as cpHasBugTypeData } from "@src/__mocks__/mockedDb/cpHasBugType";
import { data as cpCandidaturesData } from "@src/__mocks__/mockedDb/cpHasCandidates";
import { data as cpReplicabilityData } from "@src/__mocks__/mockedDb/cpHasReplicabilities";
import { data as cpSeverityData } from "@src/__mocks__/mockedDb/cpHasSeverities";
import { data as cpHasTaskGroupsData } from "@src/__mocks__/mockedDb/cpHasTaskGroups";
import { data as cpUsecasesData } from "@src/__mocks__/mockedDb/cpHasUsecases";
import { data as osDeviceData } from "@src/__mocks__/mockedDb/deviceOs";
import { data as platformDeviceData } from "@src/__mocks__/mockedDb/devicePlatform";
import { data as profileData } from "@src/__mocks__/mockedDb/profile";
import { data as userDeviceData } from "@src/__mocks__/mockedDb/testerDevice";
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
  usecase: 1,
  device: 1,
  media: ["www.example.com/media69.jpg", "www.example.com/media6969.jpg"],
};
const bugWithAdditional = {
  title: "Campaign Title",
  description: "Camapign Description",
  expected: "The expected to reproduce the bug",
  current: "Current case",
  severity: "LOW",
  replicability: "ONCE",
  type: "CRASH",
  notes: "The bug notes",
  usecase: 1,
  device: 1,
  media: ["www.example.com/media69.jpg", "www.example.com/media6969.jpg"],
  additional: [
    { slug: "browser", value: "Chrome" },
    { slug: "codice-cliente", value: "google" },
    { slug: "nome-banca", value: "intesa" },
  ],
};
const bugPartiallyInvalidAdditionalFields = {
  title: "Campaign Title",
  description: "Camapign Description",
  expected: "The expected to reproduce the bug",
  current: "Current case",
  severity: "LOW",
  replicability: "ONCE",
  type: "CRASH",
  notes: "The bug notes",
  usecase: 1,
  device: 1,
  media: ["www.example.com/media69.jpg", "www.example.com/media6969.jpg"],
  additional: [
    { slug: "browser", value: "Chrome" },
    { slug: "codice-cliente", value: "google" },
    { slug: "nome-banca", value: "intendiamoci" },
  ],
};

const bugBadAdditionalFields = {
  title: "Campaign Title",
  description: "Camapign Description",
  expected: "The expected to reproduce the bug",
  current: "Current case",
  severity: "LOW",
  replicability: "ONCE",
  type: "CRASH",
  notes: "The bug notes",
  usecase: 1,
  device: 1,
  media: ["www.example.com/media69.jpg", "www.example.com/media6969.jpg"],
  additional: [{ slug: "browser", value: "Chrome" }],
};
const bugCampaignAnyDevice = {
  title: "Campaign Title",
  description: "Camapign Description",
  expected: "The expected to reproduce the bug",
  current: "Current case",
  severity: "LOW",
  replicability: "ONCE",
  type: "CRASH",
  notes: "The bug notes",
  usecase: -1,
  device: 1,
  media: ["www.example.com/media69.jpg", "www.example.com/media6969.jpg"],
};
const bugBadSeverity = {
  title: "Campaign Title",
  description: "Camapign Description",
  expected: "The expected to reproduce the bug",
  current: "Current case",
  severity: "HIGH",
  replicability: "ONCE",
  type: "CRASH",
  notes: "The bug notes",
  usecase: 1,
  device: 1,
  media: ["the media1 url"],
};
const bugBadReplicability = {
  title: "Campaign Title",
  description: "Camapign Description",
  expected: "The expected to reproduce the bug",
  current: "Current case",
  severity: "LOW",
  replicability: "SOMETIMES",
  type: "CRASH",
  notes: "The bug notes",
  usecase: 1,
  device: 1,
  media: ["the media1 url"],
};
const bugBadBugType = {
  title: "Campaign Title",
  description: "Camapign Description",
  expected: "The expected to reproduce the bug",
  current: "Current case",
  severity: "LOW",
  replicability: "ONCE",
  type: "TYPO",
  notes: "The bug notes",
  usecase: 1,
  device: 1,
  media: ["the media1 url"],
};
const bugBadUseCase = {
  title: "Campaign Title",
  description: "Camapign Description",
  expected: "The expected to reproduce the bug",
  current: "Current case",
  severity: "LOW",
  replicability: "ONCE",
  type: "CRASH",
  notes: "The bug notes",
  usecase: 69,
  device: 1,
  media: ["the media1 url"],
};
const bugNotSpecificUsecase = {
  title: "Campaign Title",
  description: "Camapign Description",
  expected: "The expected to reproduce the bug",
  current: "Current case",
  severity: "LOW",
  replicability: "ONCE",
  type: "CRASH",
  notes: "The bug notes",
  usecase: -1,
  device: 1,
  media: ["the media1 url"],
};
const bugBadDevice = {
  title: "Campaign Title",
  description: "Camapign Description",
  expected: "The expected to reproduce the bug",
  current: "Current case",
  severity: "LOW",
  replicability: "ONCE",
  type: "CRASH",
  notes: "The bug notes",
  usecase: 1,
  device: 696969,
  media: ["the media1 url"],
};

jest.mock("@src/features/getMimetypeFromS3");
(getMimetypeFromS3 as jest.Mock).mockReturnValue("image");

describe("Route POST a bug to a specific campaign", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await wpUserData.basicUser();
      await profileData.basicTester();
      await campaignData.basicCampaign({
        base_bug_internal_id: "BASE1BUGINTERNAL",
      });
      await campaignData.basicCampaign({ id: 3 });
      await campaignData.basicCampaign({
        id: 4,
        base_bug_internal_id: "BASE4BUGINTERNAL",
      });

      await cpCandidaturesData.candidate1({
        selected_device: 1,
        accepted: 1,
        campaign_id: 1,
      });
      await cpCandidaturesData.candidate1({
        selected_device: 0,
        accepted: 1,
        campaign_id: 4,
      });
      await severityData.severity({ name: "LOW" });
      await severityData.severity({ id: 2, name: "HIGH" });
      await replicabilityData.replicability({ name: "Once" });
      await replicabilityData.replicability({ id: 2, name: "Sometimes" });
      await bugTypesData.bugType({ name: "Crash" });
      await bugTypesData.bugType({ id: 2, name: "Typo" });
      await bugTypesData.bugType({ id: 3, name: "Other", is_enabled: 0 });
      await cpUsecasesData.usecase1();
      await cpUsecasesData.usecase1({ id: 2 });
      await cpHasTaskGroupsData.group1();
      await platformDeviceData.platform1({ name: "Android" });
      await osDeviceData.os1({
        id: 798,
        version_number: "11",
        display_name: "11",
      });
      await userDeviceData.device1({
        manufacturer: "Acer",
        model: "Iconia A1",
        platform_id: 1,
        os_version_id: 798,
        os_version: "11 (11)",
        operating_system: "Android",
        form_factor: "Tablet",
        source_id: 950,
      });
      await additionalFields.additional1({
        slug: "codice-cliente",
        type: "regex",
        validation: "^[0-9a-zA-Z]+$",
      });
      await additionalFields.additional1({
        id: 2,
        slug: "nome-banca",
        type: "select",
        validation: "intesa; etruria; sanpaolo",
      });
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await wpUserData.drop();
      await profileData.drop();
      await campaignData.drop();
      await cpCandidaturesData.drop();
      await severityData.drop();
      await cpSeverityData.drop();
      await replicabilityData.drop();
      await cpReplicabilityData.drop();
      await bugTypesData.drop();
      await cpHasBugTypeData.drop();
      await cpUsecasesData.drop();
      await cpHasTaskGroupsData.drop();
      await bugData.drop();
      await bugMedia.clear();
      await platformDeviceData.drop();
      await userDeviceData.drop();
      await osDeviceData.drop();
      await additionalFields.drop();
      await additionalFieldsData.drop();

      resolve(null);
    });
  });
  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).post("/users/me/campaigns/1/bugs");
    expect(response.status).toBe(403);
  });
  it("Should answer 404 if campaign does not exist", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/2/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      element: "bugs",
      id: 0,
      message: "CP2, does not exists.",
    });
  });
  it("Should answer 403 if user is not selected on CP", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/3/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      element: "bugs",
      id: 0,
      message: "T1 is not candidate on CP3.",
    });
  });
  it("Should answer 403 if a user sends an unaccepted usecase on CP", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bugBadUseCase);
    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      element: "bugs",
      id: 0,
      message: `Usecase ${bugBadUseCase.usecase} not found for CP1.`,
    });
  });
  it("Should answer 403 if a user sends the not-candidate devices on CP", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bugBadDevice);
    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      element: "bugs",
      id: 0,
      message: `Device is not candidate on CP1.`,
    });
  });
  it("Should answer 200 if user sends a bug with any user-device on a CP selected_device = 0", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/4/bugs")
      .set("authorization", "Bearer tester")
      .send(bugCampaignAnyDevice);
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
      .send(bugWithAdditional);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("additional");
    expect(response.body.additional).toMatchObject({});
  });
});

describe("Route POST a bug to a specific campaign - with custom type", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await wpUserData.basicUser();
      await profileData.basicTester();
      await campaignData.basicCampaign({
        base_bug_internal_id: "BASEBUGINTERNAL",
      });

      await cpCandidaturesData.candidate1();
      await severityData.severity({ name: "LOW" });
      await severityData.severity({ id: 2, name: "HIGH" });
      await cpSeverityData.cpSeverity({ campaign_id: 1 });
      await replicabilityData.replicability({ name: "Once" });
      await bugTypesData.bugType({ name: "Crash" });
      await bugTypesData.bugType({ id: 2, name: "Typo" });
      await bugTypesData.bugType({ id: 3, name: "Other", is_enabled: 0 });
      await cpHasBugTypeData.cpBugType({ campaign_id: 1 });
      await cpHasBugTypeData.cpBugType({
        id: 2,
        campaign_id: 1,
        bug_type_id: 3,
      });
      await cpUsecasesData.usecase1();
      await cpHasTaskGroupsData.group1();
      await platformDeviceData.platform1({ name: "Android" });
      await osDeviceData.os1({
        id: 798,
        version_number: "11",
        display_name: "11",
      });
      await userDeviceData.device1({
        manufacturer: "Acer",
        model: "Iconia A1",
        platform_id: 1,
        os_version_id: 798,
        os_version: "11 (11)",
        operating_system: "Android",
        form_factor: "Tablet",
        source_id: 950,
      });

      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await profileData.drop();
      await wpUserData.drop();
      await campaignData.drop();
      await cpCandidaturesData.drop();
      await severityData.drop();
      await cpSeverityData.drop();
      await replicabilityData.drop();
      await cpReplicabilityData.drop();
      await bugTypesData.drop();
      await cpHasBugTypeData.drop();
      await cpUsecasesData.drop();
      await cpHasTaskGroupsData.drop();
      await bugData.drop();
      await bugMedia.clear();
      await platformDeviceData.drop();
      await osDeviceData.drop();
      await userDeviceData.drop();
      await additionalFields.drop();
      await additionalFieldsData.drop();

      resolve(null);
    });
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
    return new Promise(async (resolve) => {
      await wpUserData.basicUser();
      await profileData.basicTester();
      await campaignData.basicCampaign({
        base_bug_internal_id: "BASEBUGINTERNAL",
      });
      await cpCandidaturesData.candidate1();
      await severityData.severity({ name: "LOW" });
      await severityData.severity({ id: 2, name: "HIGH" });
      await cpSeverityData.cpSeverity({ campaign_id: 1 });
      await replicabilityData.replicability({ name: "Once" });
      await bugTypesData.bugType({ name: "Crash" });
      await cpUsecasesData.usecase1();
      await cpHasTaskGroupsData.group1();
      await platformDeviceData.platform1({ name: "Android" });
      await osDeviceData.os1({
        id: 798,
        version_number: "11",
        display_name: "11",
      });
      await userDeviceData.device1({
        manufacturer: "Acer",
        model: "Iconia A1",
        platform_id: 1,
        os_version_id: 798,
        os_version: "11 (11)",
        operating_system: "Android",
        form_factor: "Tablet",
        source_id: 950,
      });

      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await wpUserData.drop();
      await profileData.drop();
      await campaignData.drop();
      await cpCandidaturesData.drop();
      await severityData.drop();
      await cpSeverityData.drop();
      await replicabilityData.drop();
      await cpReplicabilityData.drop();
      await bugTypesData.drop();
      await cpHasBugTypeData.drop();
      await cpUsecasesData.drop();
      await cpHasTaskGroupsData.drop();
      await bugData.drop();
      await bugMedia.clear();
      await platformDeviceData.drop();
      await osDeviceData.drop();
      await userDeviceData.drop();
      await additionalFields.drop();
      await additionalFieldsData.drop();

      resolve(null);
    });
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
    return new Promise(async (resolve) => {
      await wpUserData.basicUser();
      await profileData.basicTester();
      await campaignData.basicCampaign({
        base_bug_internal_id: "BASEBUGINTERNAL",
      });
      await cpCandidaturesData.candidate1();
      await severityData.severity({ name: "LOW" });
      await replicabilityData.replicability({ name: "Once" });
      await replicabilityData.replicability({ id: 2, name: "Sometimes" });
      await cpReplicabilityData.cpReplicability({ campaign_id: 1 });
      await bugTypesData.bugType({ name: "Crash" });
      await cpUsecasesData.usecase1();
      await cpHasTaskGroupsData.group1();
      await platformDeviceData.platform1({ name: "Android" });
      await osDeviceData.os1({
        id: 798,
        version_number: "11",
        display_name: "11",
      });
      await userDeviceData.device1({
        manufacturer: "Acer",
        model: "Iconia A1",
        platform_id: 1,
        os_version_id: 798,
        os_version: "11 (11)",
        operating_system: "Android",
        form_factor: "Tablet",
        source_id: 950,
      });

      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await wpUserData.drop();
      await profileData.drop();
      await campaignData.drop();
      await cpCandidaturesData.drop();
      await severityData.drop();
      await cpSeverityData.drop();
      await replicabilityData.drop();
      await cpReplicabilityData.drop();
      await bugTypesData.drop();
      await cpHasBugTypeData.drop();
      await cpUsecasesData.drop();
      await cpHasTaskGroupsData.drop();
      await bugData.drop();
      await bugMedia.clear();
      await platformDeviceData.drop();
      await osDeviceData.drop();
      await userDeviceData.drop();
      await additionalFields.drop();
      await additionalFieldsData.drop();

      resolve(null);
    });
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
    return new Promise(async (resolve) => {
      await wpUserData.basicUser();
      await profileData.basicTester();
      await campaignData.basicCampaign({
        base_bug_internal_id: "BASEBUGINTERNAL",
      });
      await cpCandidaturesData.candidate1();
      await severityData.severity({ name: "LOW" });
      await replicabilityData.replicability({ name: "Once" });
      await replicabilityData.replicability({ id: 2, name: "Sometimes" });
      await cpReplicabilityData.cpReplicability({ campaign_id: 1 });
      await bugTypesData.bugType({ name: "Crash" });
      await cpUsecasesData.usecase1();
      await cpHasTaskGroupsData.group1();

      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await wpUserData.drop();
      await profileData.drop();
      await campaignData.drop();
      await cpCandidaturesData.drop();
      await severityData.drop();
      await cpSeverityData.drop();
      await replicabilityData.drop();
      await cpReplicabilityData.drop();
      await bugTypesData.drop();
      await cpHasBugTypeData.drop();
      await cpUsecasesData.drop();
      await cpHasTaskGroupsData.drop();
      await bugData.drop();
      await bugMedia.clear();
      await userDeviceData.drop();
      await additionalFields.drop();
      await additionalFieldsData.drop();

      resolve(null);
    });
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
    return new Promise(async (resolve) => {
      await wpUserData.basicUser();
      await profileData.basicTester();
      await campaignData.basicCampaign({
        base_bug_internal_id: "BASE1BUGINTERNAL",
      });
      await campaignData.basicCampaign({ id: 3 });
      await campaignData.basicCampaign({
        id: 4,
        base_bug_internal_id: "BASE4BUGINTERNAL",
      });

      await cpCandidaturesData.candidate1({
        selected_device: 1,
        accepted: 1,
        campaign_id: 1,
      });
      await cpCandidaturesData.candidate1({
        selected_device: 0,
        accepted: 1,
        campaign_id: 4,
      });
      await severityData.severity({ name: "LOW" });
      await severityData.severity({ id: 2, name: "HIGH" });
      await replicabilityData.replicability({ name: "Once" });
      await replicabilityData.replicability({ id: 2, name: "Sometimes" });
      await bugTypesData.bugType({ name: "Crash" });
      await bugTypesData.bugType({ id: 2, name: "Typo" });
      await bugTypesData.bugType({ id: 3, name: "Other", is_enabled: 0 });
      await cpUsecasesData.usecase1();
      await cpUsecasesData.usecase1({ id: 2 });
      await cpHasTaskGroupsData.group1();
      await platformDeviceData.platform1({ name: "Android" });
      await osDeviceData.os1({
        id: 798,
        version_number: "11",
        display_name: "11",
      });
      await userDeviceData.device1({
        manufacturer: "Acer",
        model: "Iconia A1",
        platform_id: 1,
        os_version_id: 798,
        os_version: "11 (11)",
        operating_system: "Android",
        form_factor: "Tablet",
        source_id: 950,
      });
      await additionalFields.additional1({
        slug: "codice-cliente",
        type: "regex",
        validation: "^[0-9a-zA-Z]+$",
      });
      await additionalFields.additional1({
        id: 2,
        slug: "nome-banca",
        type: "select",
        validation: "intesa; etruria; sanpaolo",
      });
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await wpUserData.drop();
      await profileData.drop();
      await campaignData.drop();
      await cpCandidaturesData.drop();
      await severityData.drop();
      await cpSeverityData.drop();
      await replicabilityData.drop();
      await cpReplicabilityData.drop();
      await bugTypesData.drop();
      await cpHasBugTypeData.drop();
      await cpUsecasesData.drop();
      await cpHasTaskGroupsData.drop();
      await bugData.drop();
      await bugMedia.clear();
      await userDeviceData.drop();
      await platformDeviceData.drop();
      await osDeviceData.drop();
      await additionalFields.drop();
      await additionalFieldsData.drop();

      resolve(null);
    });
  });

  it("Should return inserted bug without additional if a user send invalid additional fields", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bugBadAdditionalFields);
    expect(response.status).toBe(200);
    expect(response.body.additional).toBe(undefined);
  });
  it("Should return inserted with accpted additional fields if a user sends partially invalid additional fields ", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bugPartiallyInvalidAdditionalFields);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("additional");
    expect(response.body.additional).toMatchObject([
      { slug: "codice-cliente", value: "google" },
    ]);
  });
});
