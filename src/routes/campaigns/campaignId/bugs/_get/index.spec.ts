import request from "supertest";
import app from "@src/app";
import Campaigns from "@src/__mocks__/mockedDb/campaign";
import Profile from "@src/__mocks__/mockedDb/profile";
import WpUsers from "@src/__mocks__/mockedDb/wp_users";
import TesterDevices from "@src/__mocks__/mockedDb/testerDevice";
import Candidate from "@src/__mocks__/mockedDb/cpHasCandidates";
import BugType from "@src/__mocks__/mockedDb/bugTypes";
import { data as BugStatus } from "@src/__mocks__/mockedDb/bugStatus";
import BugReplicabilities from "@src/__mocks__/mockedDb/bugReplicabilities";
import BugSeverities from "@src/__mocks__/mockedDb/bugSeverities";
import { data as Bugs } from "@src/__mocks__/mockedDb/bug";
import sqlite3 from "@src/features/sqlite";
// import BugTag from "@src/__mocks__/mockedDb";

//import { tryber } from "@src/features/database";
//   await tryber.tables.WpAppqEvdBug.do().insert({

beforeAll(async () => {
  await Profile.insert({ id: 1, name: "John", surname: "Doe", wp_user_id: 1 });
  await WpUsers.insert({ ID: 1 });
  await Campaigns.insert({ id: 1 });

  await TesterDevices.insert({
    id: 1,
    id_profile: 1,
    form_factor: "Smartphone",
    manufacturer: "Apple",
    model: "iPhone 11",
    platform_id: 1,
    os_version_id: 1,
    enabled: 1,
  });
  await Candidate.insert({
    user_id: 1,
    campaign_id: 1,
    accepted: 1,
  });

  await Profile.insert({ id: 2, name: "Deleted User" });
  await WpUsers.insert({ ID: 2 });

  await Bugs.basicBug({
    status_id: 1,
    severity_id: 1,
    bug_replicability_id: 1,
    bug_type_id: 1,
    internal_id: "internal_id_1",
    message: "this is title Bug",
  });

  await BugSeverities.insert({
    id: 1,
    name: "This is the Severity name",
  });
  await sqlite3.insert("wp_appq_evd_bug_status", {
    id: 1,
    name: "This is the Status name",
  });
  await BugType.insert({
    id: 1,
    name: "This is the Type name",
    is_enabled: 1,
  });
  await BugReplicabilities.insert({
    id: 1,
    name: "This is the Type name",
  });
});

afterAll(async () => {
  await Campaigns.clear();
  await WpUsers.clear();
  await Profile.clear();
  await TesterDevices.clear();
  await Candidate.clear();
  await Bugs.drop();
  await BugStatus.drop();
  await BugSeverities.clear();
  await BugType.clear();
  await BugReplicabilities.clear();
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
    console.log(response.body);
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
    console.log(response.body);
    expect(response.body.items).toEqual([
      {
        id: 1,
        title: "this is title Bug",
        internalId: "internal_id_1",
        status: { id: 1, name: "This is the Status name" },
        type: { id: 1, name: "This is the Type name" },
        severity: { id: 1, name: "This is the Severity name" },
        tester: { id: 1, name: "John", surname: "Doe" },
      },
    ]);
  });
});
