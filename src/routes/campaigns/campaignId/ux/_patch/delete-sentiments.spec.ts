import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

jest.mock("@src/features/checkUrl", () => ({
  checkUrl: jest.fn().mockImplementation(() => true),
}));
const campaign = {
  title: "Test Campaign",
  platform_id: 1,
  start_date: "2021-01-01",
  end_date: "2021-01-01",
  pm_id: 1,
  page_manual_id: 1,
  page_preview_id: 1,
  customer_id: 1,
  project_id: 1,
  customer_title: "Test Customer",
};

const requestBody = {
  goal: "Test Goal",
  usersNumber: 5,
  insights: [],
  sentiments: [],
  questions: [],
  methodology: {
    name: "Methodology Name",
    type: "qualitative",
    description: "Methodology Description",
  },
};

describe("PATCH /campaigns/{campaignId}/ux - permissions and logging statuses", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 1, campaign_type_id: 1 },
    ]);
    await tryber.tables.UxCampaignData.do().insert({
      campaign_id: 1,
      version: 1,
      methodology_type: "qualitative",
      methodology_description: "Methodology Description",
    });
    await tryber.tables.WpAppqCampaignType.do().insert({
      id: 1,
      name: "UX Generic",
      category_id: 1,
    });
    await tryber.tables.WpAppqUsecaseCluster.do().insert({
      id: 1,
      campaign_id: 1,
      title: "Cluster 1",
      subtitle: "Subtitle 1",
    });
    await tryber.tables.UxCampaignSentiments.do().insert({
      id: 1,
      cluster_id: 1,
      campaign_id: 1,
      value: 1,
      comment: "test",
      version: 1,
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
  });

  it("Should return remove sentiments ", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .send({ ...requestBody, sentiments: [] })
      .set("Authorization", "Bearer admin");
    const response = await request(app)
      .get("/campaigns/1/ux")
      .set("Authorization", "Bearer admin");
    expect(response.body.sentiments).toHaveLength(0);
  });
});
