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

describe("PATCH /campaigns/{campaignId}/ux - from publish", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([{ ...campaign, id: 1 }]);
    await tryber.tables.WpAppqUsecaseCluster.do().insert([
      {
        id: 1,
        title: "Cluster 1",
        subtitle: "Subtitle 1",
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
    await tryber.tables.UxCampaignData.do().insert([
      {
        campaign_id: 1,
        version: 1,
        published: 1,
        methodology_description: methodology.description,
        methodology_type: methodology.type,
      },
      {
        campaign_id: 1,
        version: 2,
        published: 0,
        methodology_description: methodology.description,
        methodology_type: methodology.type,
      },
    ]);

    await tryber.tables.UxCampaignQuestions.do().insert([
      {
        id: 1,
        campaign_id: 1,
        version: 1,
        question: "Publish question",
      },
      {
        id: 2,
        campaign_id: 1,
        version: 2,
        question: "Draft Modified question",
      },
      {
        id: 3,
        campaign_id: 2,
        version: 1,
        question: "Draft question CP2",
      },
    ]);
  });

  afterEach(async () => {
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.UxCampaignQuestions.do().delete();
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
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual(
      expect.objectContaining({
        version: 1,
        published: 1,
        campaign_id: 1,
      })
    );
    expect(data[1]).toEqual(
      expect.objectContaining({
        version: 2,
        published: 0,
        campaign_id: 1,
      })
    );
  });

  it("Should update a methodology description in the draft", async () => {
    const draftBefore = await tryber.tables.UxCampaignData.do()
      .select("methodology_description")
      .where({ version: 2, published: 0 })
      .first();
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        sentiments: [],
        questions: [],
        methodology: { ...methodology, description: "New description" },
      });

    const updatedDraft = await tryber.tables.UxCampaignData.do()
      .select("methodology_description")
      .where({ version: 2, published: 0 })
      .first();
    expect(updatedDraft?.methodology_description).not.toEqual(
      draftBefore?.methodology_description
    );
    expect(updatedDraft?.methodology_description).toEqual("New description");
  });

  it("Should update a methodology type in the draft", async () => {
    const draftBefore = await tryber.tables.UxCampaignData.do()
      .select("methodology_type")
      .where({ version: 2, published: 0 })
      .first();
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        sentiments: [],
        questions: [],
        methodology: { ...methodology, type: "quantitative" },
      });

    const updatedDraft = await tryber.tables.UxCampaignData.do()
      .select("methodology_type")
      .where({ version: 2, published: 0 })
      .first();
    expect(updatedDraft?.methodology_type).not.toEqual(
      draftBefore?.methodology_type
    );
    expect(updatedDraft?.methodology_type).toEqual("quantitative");
  });

  it("Should update a question in the draft", async () => {
    const questionsBefore = await tryber.tables.UxCampaignQuestions.do()
      .select("question")
      .where({ version: 2 })
      .where({ campaign_id: 1 })
      .first();
    await request(app)
      .patch("/campaigns/1/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        sentiments: [],
        questions: [{ name: "Updated Draft Question", id: 2 }],
        methodology,
      });

    const updatedQuestion = await tryber.tables.UxCampaignQuestions.do()
      .select("question")
      .where({ version: 2 })
      .first();
    expect(updatedQuestion?.question).not.toEqual(questionsBefore?.question);
    expect(updatedQuestion?.question).toEqual("Updated Draft Question");
  });

  it("Should update the goal in the draft", async () => {
    const draftBefore = await tryber.tables.UxCampaignData.do()
      .select("goal")
      .where({ version: 2, published: 0 })
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

    const updatedDraft = await tryber.tables.UxCampaignData.do()
      .select("goal")
      .where({ version: 2, published: 0 })
      .first();
    expect(updatedDraft?.goal).not.toEqual(draftBefore?.goal);
    expect(updatedDraft?.goal).toEqual("New Test Goal");
  });

  it("Should update the users number in the draft", async () => {
    const draftBefore = await tryber.tables.UxCampaignData.do()
      .select("users")
      .where({ version: 2, published: 0 })
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

    const updatedDraft = await tryber.tables.UxCampaignData.do()
      .select("users")
      .where({ version: 2, published: 0 })
      .first();
    expect(updatedDraft?.users).not.toEqual(draftBefore?.users);
    expect(updatedDraft?.users).toEqual(6);
  });
});
