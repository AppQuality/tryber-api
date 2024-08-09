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

const methodology = {
  type: "qualitative",
  description: "Methodology Description",
};

describe("PATCH /campaigns/{campaignId}/ux - update data", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 10 },
      { ...campaign, id: 20 },
    ]);
    await tryber.tables.WpAppqUsecaseCluster.do().insert([
      {
        id: 1,
        title: "Cluster 1",
        subtitle: "Subtitle 1",
        campaign_id: 10,
      },
      {
        id: 2,
        title: "Cluster 2",
        subtitle: "Subtitle 2",
        campaign_id: 10,
      },
      {
        id: 3,
        title: "Cluster 3",
        subtitle: "Subtitle 3",
        campaign_id: 20,
      },
    ]);
    await tryber.tables.WpAppqUserTaskMedia.do().insert([
      {
        id: 1,
        campaign_task_id: 1,
        user_task_id: 1,
        tester_id: 1,
        location:
          "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqUserTaskMedia.do().delete();
    await tryber.tables.WpAppqUsecaseCluster.do().delete();
  });
  beforeEach(async () => {
    await tryber.tables.UxCampaignData.do().insert({
      id: 10,
      goal: "Test Goal",
      users: 5,
      campaign_id: 10,
      published: 0,
      methodology_description: methodology.description,
      methodology_type: methodology.type,
    });
    await tryber.tables.UxCampaignQuestions.do().insert([
      {
        id: 1,
        campaign_id: 10,
        question: "Question 1",
        version: 1,
      },
      {
        id: 2,
        campaign_id: 10,
        question: "Question 2",
        version: 1,
      },
      {
        id: 3,
        campaign_id: 20,
        question: "Question 1 - Campaign 20",
        version: 1,
      },
    ]);
    await tryber.tables.UxCampaignSentiments.do().insert([
      {
        id: 1,
        campaign_id: 10,
        value: 3,
        comment: "Comment Sentiment 1",
        cluster_id: 1,
        version: 1,
      },
      {
        id: 2,
        campaign_id: 10,
        value: 5,
        comment: "Comment Sentiment 2",
        cluster_id: 1,
        version: 1,
      },
      {
        id: 3,
        campaign_id: 20,
        value: 3,
        comment: "Comment Sentiment 1 - Campaign 20",
        cluster_id: 2,
        version: 1,
      },
    ]);
  });
  afterEach(async () => {
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.UxCampaignQuestions.do().delete();
    await tryber.tables.UxCampaignSentiments.do().delete();
  });

  it("Should update questions", async () => {
    await request(app)
      .patch("/campaigns/10/ux")
      .set("Authorization", "Bearer admin")
      .send({
        questions: [
          { name: "New question1" },
          { name: "New question2" },
          { name: "New question3" },
        ],
        methodology,
      });
    const questions = await tryber.tables.UxCampaignQuestions.do()
      .select()
      .where({ campaign_id: 10 });

    expect(questions).toHaveLength(3);
    expect(questions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          question: "New question1",
        }),
        expect.objectContaining({
          question: "New question2",
        }),
        expect.objectContaining({
          question: "New question3",
        }),
      ])
    );
  });

  it("Should update sentiments", async () => {
    await request(app)
      .patch("/campaigns/10/ux")
      .set("Authorization", "Bearer admin")
      .send({
        sentiments: [
          {
            comment: "New comment 1",
            value: 2,
            clusterId: 1,
          },
        ],
      });
    const sentiments = await tryber.tables.UxCampaignSentiments.do()
      .select()
      .where({ campaign_id: 10 });
    expect(sentiments).toHaveLength(1);
    expect(sentiments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          comment: "New comment 1",
          value: 2,
        }),
      ])
    );
  });

  it("Should update only methodology type", async () => {
    const actualData = await tryber.tables.UxCampaignData.do()
      .select()
      .where({ campaign_id: 10 })
      .first();

    await request(app)
      .patch("/campaigns/10/ux")
      .set("Authorization", "Bearer admin")
      .send({
        methodology: { ...methodology, type: "quali-quantitative" },
      });

    const data = await tryber.tables.UxCampaignData.do()
      .select()
      .where({ campaign_id: 10 })
      .first();

    expect(actualData?.methodology_type).not.toEqual(data?.methodology_type);
    expect(data).toEqual(
      expect.objectContaining({
        methodology_type: "quali-quantitative",
        methodology_description: actualData?.methodology_description,
        goal: actualData?.goal,
        users: actualData?.users,
        published: actualData?.published,
      })
    );
  });

  it("Should update only methodology description", async () => {
    const actualData = await tryber.tables.UxCampaignData.do()
      .select()
      .where({ campaign_id: 10 })
      .first();

    await request(app)
      .patch("/campaigns/10/ux")
      .set("Authorization", "Bearer admin")
      .send({
        methodology: { ...methodology, description: "The new description" },
      });

    const data = await tryber.tables.UxCampaignData.do()
      .select()
      .where({ campaign_id: 10 })
      .first();

    expect(actualData?.methodology_description).not.toEqual(
      data?.methodology_description
    );
    expect(data).toEqual(
      expect.objectContaining({
        methodology_description: "The new description",
        methodology_type: actualData?.methodology_type,
        goal: actualData?.goal,
        users: actualData?.users,
        published: actualData?.published,
      })
    );
  });

  it("Should update only goal", async () => {
    const actualData = await tryber.tables.UxCampaignData.do()
      .select()
      .where({ campaign_id: 10 })
      .first();

    await request(app)
      .patch("/campaigns/10/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "New Test Goal",
      });

    const data = await tryber.tables.UxCampaignData.do()
      .select()
      .where({ campaign_id: 10 })
      .first();

    expect(actualData?.goal).not.toEqual(data?.goal);
    expect(data).toEqual(
      expect.objectContaining({
        goal: "New Test Goal",
        methodology_description: actualData?.methodology_description,
        methodology_type: actualData?.methodology_type,
        users: actualData?.users,
        published: actualData?.published,
      })
    );
  });

  it("Should update only users number", async () => {
    const actualData = await tryber.tables.UxCampaignData.do()
      .select()
      .where({ campaign_id: 10 })
      .first();

    await request(app)
      .patch("/campaigns/10/ux")
      .set("Authorization", "Bearer admin")
      .send({
        usersNumber: 6,
      });

    const data = await tryber.tables.UxCampaignData.do()
      .select()
      .where({ campaign_id: 10 })
      .first();

    expect(actualData?.users).not.toEqual(data?.users);
    expect(data).toEqual(
      expect.objectContaining({
        users: 6,
        goal: actualData?.goal,
        methodology_description: actualData?.methodology_description,
        methodology_type: actualData?.methodology_type,
        published: actualData?.published,
      })
    );
  });

  it("Should update only visible status to publish =1 when send visible=1", async () => {
    const actualData = await tryber.tables.UxCampaignData.do()
      .select()
      .where({ campaign_id: 10 })
      .first();
    await request(app)
      .patch("/campaigns/10/ux")
      .set("Authorization", "Bearer admin")
      .send({
        visible: 1,
      });

    const data = await tryber.tables.UxCampaignData.do()
      .select()
      .where({ campaign_id: 10 });
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual(
      expect.objectContaining({
        published: 1,
        goal: actualData?.goal,
        methodology_description: actualData?.methodology_description,
        methodology_type: actualData?.methodology_type,
        users: actualData?.users,
      })
    );
    expect(actualData?.published).not.toEqual(data[0].published);
  });

  it("Should allow setting visible to 0", async () => {
    await request(app)
      .patch("/campaigns/10/ux")
      .set("Authorization", "Bearer admin")
      .send({
        visible: 1,
      });
    await request(app)
      .patch("/campaigns/10/ux")
      .set("Authorization", "Bearer admin")
      .send({
        visible: 0,
      });
    const campaign = await tryber.tables.UxCampaignData.do()
      .select()
      .where({ campaign_id: 10 })
      .first();
    expect(campaign?.published).toEqual(0);
  });
  it("Should return 500 if send a sentiment value greater than 5 or lower then 1", async () => {
    const responseValue6 = await request(app)
      .patch("/campaigns/10/ux")
      .set("Authorization", "Bearer admin")
      .send({
        sentiments: [
          {
            comment: "Comment - Wrong value not in 1-5",
            value: 6,
            clusterId: 1,
          },
        ],
      });
    expect(responseValue6.status).toBe(500);
    const responseValue0 = await request(app)
      .patch("/campaigns/10/ux")
      .set("Authorization", "Bearer admin")
      .send({
        sentiments: [
          {
            comment: "Comment - Wrong value not in 1-5",
            value: 0,
            clusterId: 1,
          },
        ],
      });
    expect(responseValue0.status).toBe(500);
  });
});
