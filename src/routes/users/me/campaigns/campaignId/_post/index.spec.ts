import { data as campaignData } from "@src/__mocks__/mockedDb/campaign";
import { data as cpCandidaturesData } from "@src/__mocks__/mockedDb/cp_has_candidates";
import app from "@src/app";
import request from "supertest";

//import { data as severityData } from '@src/__mocks__/mockedDb/severities';
//import app from '@src/app';
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
describe("Route POST a bug to a specific campaign", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await campaignData.basicCampaign();
      await campaignData.basicCampaign({ id: 3 });
      await cpCandidaturesData.candidate1();
      //   await severityData.severity({ name: "LOW" });
      //   await severityData.severity({ id: 2, name: "HIGTH" });
      //   await cpSeverityData.cpSeverity({ bug_severity_id: 1, campaign_id: 1 });

      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await campaignData.drop();
      await cpCandidaturesData.drop();
      //   await severityData.drop();
      //   await cpSeverityData.drop();

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
});
