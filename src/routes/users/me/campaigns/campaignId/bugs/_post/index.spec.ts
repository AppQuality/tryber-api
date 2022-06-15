import { data as replicabilityData } from "@src/__mocks__/mockedDb/bugReplicabilities";
import { data as severityData } from "@src/__mocks__/mockedDb/bugSeverities";
import { data as bugTypesData } from "@src/__mocks__/mockedDb/bugTypes";
import { data as campaignData } from "@src/__mocks__/mockedDb/campaign";
import { data as cpHasBugTypeData } from "@src/__mocks__/mockedDb/cpHasBugType";
import { data as cpCandidaturesData } from "@src/__mocks__/mockedDb/cpHasCandidates";
import { data as cpReplicabilityData } from "@src/__mocks__/mockedDb/cpHasReplicabilities";
import { data as cpSeverityData } from "@src/__mocks__/mockedDb/cpHasSeverities";
import app from "@src/app";
import request from "supertest";

const bug = {
  title: "Camapign Title",
  description: "Camapign Description",
  expected: "The expected to reproduce the bug",
  current: "Current case",
  severity: "LOW",
  replicability: "ONCE",
  type: "CRASH",
  notes: "The bug notes",
  usecase: 1,
  device: 0,
  media: ["the media1 url"],
};
const bugBadSeverity = {
  title: "Camapign Title",
  description: "Camapign Description",
  expected: "The expected to reproduce the bug",
  current: "Current case",
  severity: "HIGHT",
  replicability: "ONCE",
  type: "CRASH",
  notes: "The bug notes",
  usecase: 1,
  device: 0,
  media: ["the media1 url"],
};
const bugBadReplicability = {
  title: "Camapign Title",
  description: "Camapign Description",
  expected: "The expected to reproduce the bug",
  current: "Current case",
  severity: "LOW",
  replicability: "SOMETIMES",
  type: "CRASH",
  notes: "The bug notes",
  usecase: 1,
  device: 0,
  media: ["the media1 url"],
};
const bugBadBugType = {
  title: "Camapign Title",
  description: "Camapign Description",
  expected: "The expected to reproduce the bug",
  current: "Current case",
  severity: "LOW",
  replicability: "ONCE",
  type: "TYPO",
  notes: "The bug notes",
  usecase: 1,
  device: 0,
  media: ["the media1 url"],
};
describe("Route POST a bug to a specific campaign", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await campaignData.basicCampaign();
      await campaignData.basicCampaign({ id: 3 });
      await cpCandidaturesData.candidate1();
      await severityData.severity({ name: "LOW" });
      await severityData.severity({ id: 2, name: "HIGHT" });
      await cpSeverityData.cpSeverity({ campaign_id: 1 });
      await replicabilityData.replicability({ name: "Once" });
      await replicabilityData.replicability({ id: 2, name: "Sometimes" });
      await cpReplicabilityData.cpReplicability({ campaign_id: 1 });
      await bugTypesData.bugType({ name: "CRASH" });
      await bugTypesData.bugType({ id: 2, name: "TYPO" });
      await bugTypesData.bugType({ id: 3, name: "OTHER", is_enabled: 0 });
      await cpHasBugTypeData.cpBugType({ campaign_id: 1 });
      await cpHasBugTypeData.cpBugType({
        id: 2,
        campaign_id: 1,
        bug_type_id: 3,
      });
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await campaignData.drop();
      await cpCandidaturesData.drop();
      await severityData.drop();
      await cpSeverityData.drop();
      await replicabilityData.drop();
      await cpReplicabilityData.drop();
      await bugTypesData.drop();
      await cpHasBugTypeData.drop();

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
  it("Should answer 403 if a user sends a unaccepted replicability on CP", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bugBadReplicability);
    expect(response.status).toBe(403);
    console.log(response.status);
    console.log(response.body);
    expect(response.body).toEqual({
      element: "bugs",
      id: 0,
      message: `Replicability ${bugBadReplicability.replicability} is not accepted from CP1.`,
    });
  });
  it("Should answer 403 if a user sends a unaccepted bug-type on CP", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bugBadBugType);
    console.log(response.body);
    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      element: "bugs",
      id: 0,
      message: `BugType ${bugBadBugType.type} is not accepted from CP1.`,
    });
  });
});
