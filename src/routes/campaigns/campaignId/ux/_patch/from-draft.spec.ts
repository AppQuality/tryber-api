import app from "@src/app";
import { tryber } from "@src/features/database";
import { response } from "express";
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

describe("PATCH /campaigns/{campaignId}/ux - from draft", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([{ ...campaign, id: 1 }]);
    await tryber.tables.WpAppqUsecaseCluster.do().insert([
      {
        id: 1,
        title: "Cluster 1",
        subtitle: "Subtitle 1",
        campaign_id: 1,
      },
      {
        id: 2,
        title: "Cluster 2",
        subtitle: "Subtitle 2",
        campaign_id: 1,
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
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.WpAppqUserTaskMedia.do().delete();
  });
  beforeEach(async () => {
    await tryber.tables.UxCampaignData.do().insert({
      goal: "Test Goal",
      users: 5,
      campaign_id: 1,
      version: 1,
      published: 0,
      methodology_description: methodology.description,
      methodology_type: methodology.type,
    });

    await tryber.tables.UxCampaignQuestions.do().insert([
      {
        id: 1,
        campaign_id: 1,
        question: "Draft question",
        version: 1,
      },
      {
        id: 2,
        campaign_id: 1,
        question: "Draft question2",
        version: 1,
      },
      {
        id: 3,
        campaign_id: 2,
        question: "Draft question",
        version: 1,
      },
    ]);
    await tryber.tables.UxCampaignSentiments.do().insert([
      {
        id: 1,
        campaign_id: 1,
        value: 1,
        comment: "Draft comment",
        version: 1,
        cluster_id: 1,
      },
      {
        id: 2,
        campaign_id: 1,
        value: 5,
        comment: "Draft comment",
        version: 1,
        cluster_id: 1,
      },
      {
        id: 3,
        campaign_id: 2,
        value: 3,
        comment: "Draft comment",
        version: 1,
        cluster_id: 2,
      },
    ]);
  });
  afterEach(async () => {
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.UxCampaignQuestions.do().delete();
    await tryber.tables.UxCampaignSentiments.do().delete();
  });

  it("Should not insert a new draft", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        sentiments: [],
        questions: [],
        methodology,
      });

    const data = await tryber.tables.UxCampaignData.do().select(
      "version",
      "published",
      "campaign_id"
    );
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual(
      expect.objectContaining({
        version: 1,
        published: 0,
        campaign_id: 1,
      })
    );
  });

  it("Should insert a question as draft if an item without id is sent", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        sentiments: [],
        questions: [
          {
            name: "New question",
          },
          {
            id: 1,
            name: "Draft question updated",
          },
        ],
        methodology,
      });
    const questions = await tryber.tables.UxCampaignQuestions.do()
      .select()
      .where({ campaign_id: 1 });

    expect(questions).toHaveLength(2);
    expect(questions[0]).toEqual(
      expect.objectContaining({
        id: 1,
        question: "Draft question updated",
        version: 1,
      })
    );
    expect(questions[1]).toEqual(
      expect.objectContaining({
        id: 4,
        question: "New question",
        version: 1,
      })
    );
  });

  it("Should update a questions as draft if an item with id is sent", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        sentiments: [],
        questions: [
          {
            id: 1,
            name: "Updated Draft question",
          },
        ],
        methodology,
      });
    const questions = await tryber.tables.UxCampaignQuestions.do()
      .select()
      .where({ campaign_id: 1 });
    expect(questions).toHaveLength(1);
    expect(questions[0]).toEqual(
      expect.objectContaining({
        id: 1,
        question: "Updated Draft question",
        version: 1,
      })
    );
  });

  it("Should update a sentiment as draft if an item with id is sent", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        sentiments: [
          {
            id: 1,
            comment: "Updated Draft comment",
            value: 2,
            clusterId: 1,
          },
        ],
        questions: [],
        methodology,
      });
    const sentiments = await tryber.tables.UxCampaignSentiments.do()
      .select()
      .where({ campaign_id: 1 });
    expect(sentiments).toHaveLength(1);
    expect(sentiments[0]).toEqual(
      expect.objectContaining({
        id: 1,
        comment: "Updated Draft comment",
        version: 1,
        value: 2,
        cluster_id: 1,
      })
    );
  });

  it("Should update methodology type as draft", async () => {
    const actualData = await tryber.tables.UxCampaignData.do()
      .select("methodology_type", "published", "version")
      .where({ campaign_id: 1 })
      .first();

    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        sentiments: [],
        questions: [],
        methodology: { ...methodology, type: "quali-quantitative" },
      });

    const data = await tryber.tables.UxCampaignData.do()
      .select("methodology_type", "published", "version")
      .where({ campaign_id: 1 })
      .first();

    expect(actualData?.methodology_type).not.toEqual(data?.methodology_type);
    expect(data).toEqual(
      expect.objectContaining({
        published: 0,
        version: 1,
        methodology_type: "quali-quantitative",
      })
    );
  });

  it("Should update methodology description as draft", async () => {
    const actualData = await tryber.tables.UxCampaignData.do()
      .select("methodology_description", "published", "version")
      .where({ campaign_id: 1 })
      .first();

    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        sentiments: [],
        questions: [],
        methodology: { ...methodology, description: "The new description" },
      });

    const data = await tryber.tables.UxCampaignData.do()
      .select("methodology_description", "published", "version")
      .where({ campaign_id: 1 })
      .first();

    expect(actualData?.methodology_description).not.toEqual(
      data?.methodology_description
    );
    expect(data).toEqual(
      expect.objectContaining({
        published: 0,
        version: 1,
        methodology_description: "The new description",
      })
    );
  });

  it("Should update goal as draft", async () => {
    const actualData = await tryber.tables.UxCampaignData.do()
      .select("goal", "published", "version")
      .where({ campaign_id: 1 })
      .first();

    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "New Test Goal",
        usersNumber: 5,
        sentiments: [],
        questions: [],
        methodology,
      });

    const data = await tryber.tables.UxCampaignData.do()
      .select("goal", "published", "version")
      .where({ campaign_id: 1 })
      .first();

    expect(actualData?.goal).not.toEqual(data?.goal);
    expect(data).toEqual(
      expect.objectContaining({
        published: 0,
        version: 1,
        goal: "New Test Goal",
      })
    );
  });

  it("Should update users number as draft", async () => {
    const actualData = await tryber.tables.UxCampaignData.do()
      .select("users", "published", "version")
      .where({ campaign_id: 1 })
      .first();

    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 6,
        sentiments: [],
        questions: [],
        methodology,
      });

    const data = await tryber.tables.UxCampaignData.do()
      .select("users", "published", "version")
      .where({ campaign_id: 1 })
      .first();

    expect(actualData?.users).not.toEqual(data?.users);
    expect(data).toEqual(
      expect.objectContaining({
        published: 0,
        version: 1,
        users: 6,
      })
    );
  });

  it("Should create a new version on publish", async () => {
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        status: "publish",
      });

    const data = await tryber.tables.UxCampaignData.do()
      .select()
      .where({ campaign_id: 1 });
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual(
      expect.objectContaining({
        goal: "Test Goal",
        users: 5,
        campaign_id: 1,
        version: 1,
        published: 1,
        methodology_description: "Methodology Description",
        methodology_type: "qualitative",
      })
    );
    expect(data[1]).toEqual(
      expect.objectContaining({
        goal: "Test Goal",
        users: 5,
        campaign_id: 1,
        version: 2,
        published: 0,
        methodology_description: "Methodology Description",
        methodology_type: "qualitative",
      })
    );
  });

  it("Should create a new version of questions on publish", async () => {
    const questionsBeforePatch = await tryber.tables.UxCampaignQuestions.do()
      .select()
      .where({
        campaign_id: 1,
      });

    expect(questionsBeforePatch).toHaveLength(2);
    expect(questionsBeforePatch[0]).toEqual(
      expect.objectContaining({
        id: 1,
        campaign_id: 1,
        question: "Draft question",
        version: 1,
      })
    );

    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        status: "publish",
      });

    const publishQuestion = await tryber.tables.UxCampaignQuestions.do()
      .select()
      .where({
        version: 1,
        campaign_id: 1,
      })
      .first();

    const draftQuestion = await tryber.tables.UxCampaignQuestions.do()
      .select()
      .where({
        version: 2,
        campaign_id: 1,
      })
      .first();
    expect(publishQuestion).toBeDefined();
    expect(draftQuestion).toBeDefined();

    if (!publishQuestion || !draftQuestion)
      throw new Error("Questions not found");
  });

  it("Should create a new version of sentiments on publish", async () => {
    const sentimentsBeforePatch = await tryber.tables.UxCampaignSentiments.do()
      .select()
      .where({
        campaign_id: 1,
      });

    expect(sentimentsBeforePatch).toHaveLength(2);
    expect(sentimentsBeforePatch[0]).toEqual(
      expect.objectContaining({
        id: 1,
        campaign_id: 1,
        comment: "Draft comment",
        version: 1,
      })
    );
    expect(sentimentsBeforePatch[1]).toEqual(
      expect.objectContaining({
        id: 2,
        campaign_id: 1,
        comment: "Draft comment",
        version: 1,
      })
    );

    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        status: "publish",
      });

    const publishSentiments = await tryber.tables.UxCampaignSentiments.do()
      .select()
      .where({
        version: 1,
        campaign_id: 1,
      })
      .first();

    const draftSentiments = await tryber.tables.UxCampaignSentiments.do()
      .select()
      .where({
        version: 2,
        campaign_id: 1,
      })
      .first();
    expect(publishSentiments).toBeDefined();
    expect(draftSentiments).toBeDefined();

    if (!publishSentiments || !draftSentiments)
      throw new Error("Questions not found");
  });
  it("Should return 500 if send a sentiment value greater than 5 or lower then 1", async () => {
    const response = await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        sentiments: [
          {
            id: 1,
            comment: "Updated Draft comment",
            value: 6,
            clusterId: 1,
          },
        ],
        questions: [],
        methodology,
      });
    expect(response.status).toBe(500);
  });
});
