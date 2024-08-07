import app from "@src/app";
import { tryber } from "@src/features/database";
import { getSignedCookie } from "@src/features/s3/cookieSign";
import request from "supertest";

jest.mock("@src/features/checkUrl", () => ({
  checkUrl: jest.fn().mockImplementation(() => true),
}));

jest.mock("@src/features/s3/cookieSign");
const mockedGetSignedCookie = jest.mocked(getSignedCookie, true);

mockedGetSignedCookie.mockImplementation(({ url }) => {
  return Promise.resolve({
    "CloudFront-Policy": "policy",
    "CloudFront-Signature": "signature",
    "CloudFront-Key-Pair-Id": "keypairid",
  });
});

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
  sentiments: [],
  questions: [],
  methodology: {
    name: "Methodology Name",
    type: "qualitative",
    description: "Methodology Description",
  },
};

describe("PATCH /campaigns/{campaignId}/ux - delete sentiments", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 10, campaign_type_id: 1 },
    ]);
    await tryber.tables.UxCampaignData.do().insert([
      {
        campaign_id: 10,
        methodology_type: "qualitative",
        methodology_description: "Methodology Description",
      },
      {
        campaign_id: 20,
        methodology_type: "qualitative",
        methodology_description: "Methodology Description",
      },
    ]);
    await tryber.tables.WpAppqCampaignType.do().insert({
      id: 1,
      name: "UX Generic",
      category_id: 1,
    });
    await tryber.tables.WpAppqUsecaseCluster.do().insert([
      {
        id: 1,
        campaign_id: 10,
        title: "Cluster 1",
        subtitle: "Subtitle 1",
      },
      {
        id: 2,
        campaign_id: 20,
        title: "Cluster 1",
        subtitle: "Subtitle 1",
      },
    ]);
    await tryber.tables.UxCampaignSentiments.do().insert([
      {
        id: 1,
        cluster_id: 1,
        campaign_id: 10,
        value: 1,
        comment: "test",
        version: 1,
      },
      {
        id: 2,
        cluster_id: 1,
        campaign_id: 20,
        value: 1,
        comment: "test other cp",
        version: 1,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
  });

  it("Should remove sentiments if send empty array", async () => {
    await request(app)
      .patch("/campaigns/10/ux")
      .send({ ...requestBody, sentiments: [] })
      .set("Authorization", "Bearer admin");
    const sentiments = await tryber.tables.UxCampaignSentiments.do()
      .where({
        campaign_id: 10,
      })
      .select("id");

    expect(sentiments).toEqual([]);
  });

  it("Should add sentiments", async () => {
    await request(app)
      .patch("/campaigns/10/ux")
      .send({
        ...requestBody,
        sentiments: [
          {
            comment: "New  Sentiment 1 comment",
            value: 2,
            clusterId: 1,
          },
          {
            comment: "New Sentiment 2 comment",
            value: 5,
            clusterId: 1,
          },
        ],
      })
      .set("Authorization", "Bearer admin");
    const sentiments = await tryber.tables.UxCampaignSentiments.do()
      .where({
        campaign_id: 10,
      })
      .select();

    expect(sentiments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: 2,
          comment: "New  Sentiment 1 comment",
          cluster_id: 1,
        }),
        expect.objectContaining({
          value: 5,
          comment: "New Sentiment 2 comment",
          cluster_id: 1,
        }),
      ])
    );
  });
});
