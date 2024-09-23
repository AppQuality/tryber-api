import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

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

const cluster = {
  simple_title: "Cluster title",
  content: "Cluster content",
  jf_code: "jf_code",
  jf_text: "jf_text",
  is_required: 1,
  info: "Cluster info",
  prefix: "prefix",
};

const methodology = {
  type: "qualitative",
  description: "Methodology Description",
};

describe("PATCH /campaigns/{campaignId}/ux - if no data insert ux data", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 10 },
    ]);
    await tryber.tables.WpAppqCampaignTask.do().insert([
      {
        ...cluster,
        id: 1,
        title: "Cluster 1",
        campaign_id: 10,
      },
      {
        ...cluster,
        id: 2,
        title: "Cluster 2",
        campaign_id: 2,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.WpAppqCampaignTask.do().delete();
  });

  afterEach(async () => {
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.UxCampaignQuestions.do().delete();
    await tryber.tables.UxCampaignSentiments.do().delete();
  });

  it("Should insert unpublished data ", async () => {
    await request(app)
      .patch("/campaigns/10/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        sentiments: [],
        questions: [],
        methodology,
        visible: 0,
      });

    const data = await tryber.tables.UxCampaignData.do()
      .select()
      .where({ campaign_id: 10 });
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual(
      expect.objectContaining({
        published: 0,
      })
    );
  });
  it("Should insert published data", async () => {
    await request(app)
      .patch("/campaigns/10/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        sentiments: [],
        questions: [],
        methodology,
        visible: 1,
      });

    const data = await tryber.tables.UxCampaignData.do()
      .select()
      .where({ campaign_id: 10 });
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual(
      expect.objectContaining({
        published: 1,
      })
    );
  });

  it("Should insert a question", async () => {
    await request(app)
      .patch("/campaigns/10/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        sentiments: [],
        questions: [{ name: "Is there life on Mars?" }],
        methodology,
        visible: 0,
      });
    const data = await tryber.tables.UxCampaignQuestions.do()
      .select()
      .where({ campaign_id: 10 });
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual(
      expect.objectContaining({
        question: "Is there life on Mars?",
      })
    );
  });

  it("Should insert a sentiment", async () => {
    await request(app)
      .patch("/campaigns/10/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        sentiments: [{ value: 5, clusterId: 1, comment: "My comment" }],
        questions: [],
        methodology,
        visible: 0,
      });
    const data = await tryber.tables.UxCampaignSentiments.do()
      .select()
      .where({ campaign_id: 10 });
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual(
      expect.objectContaining({
        cluster_id: 1,
        value: 5,
        comment: "My comment",
        campaign_id: 10,
      })
    );
  });

  it("Should insert methodology type", async () => {
    await request(app)
      .patch("/campaigns/10/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        sentiments: [],
        questions: [],
        methodology,
        visible: 0,
      });

    const data = await tryber.tables.UxCampaignData.do()
      .select("methodology_type")
      .first();
    expect(data?.methodology_type).toBeDefined();
    expect(data?.methodology_type).toEqual(methodology.type);
  });

  it("Should insert methodology description", async () => {
    await request(app)
      .patch("/campaigns/10/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        sentiments: [],
        questions: [],
        methodology,
        visible: 0,
      });
    const data = await tryber.tables.UxCampaignData.do()
      .select("methodology_description")
      .first();
    expect(data?.methodology_description).toBeDefined();
    expect(data?.methodology_description).toEqual(methodology.description);
  });

  it("Should insert goal", async () => {
    await request(app)
      .patch("/campaigns/10/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 5,
        sentiments: [],
        questions: [],
        methodology,
        visible: 0,
      });
    const data = await tryber.tables.UxCampaignData.do().select("goal").first();
    expect(data?.goal).toBeDefined();
    expect(data?.goal).toEqual("Test Goal");
  });

  it("Should insert users", async () => {
    await request(app)
      .patch("/campaigns/10/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        usersNumber: 6,
        sentiments: [],
        questions: [],
        methodology,
        visible: 0,
      });
    const data = await tryber.tables.UxCampaignData.do()
      .select("users")
      .first();
    expect(data?.users).toBeDefined();
    expect(data?.users).toEqual(6);
  });

  it("Should receive an error if miss users", async () => {
    const response = await request(app)
      .patch("/campaigns/10/ux")
      .set("Authorization", "Bearer admin")
      .send({
        goal: "Test Goal",
        sentiments: [],
        questions: [],
        methodology,
        visible: 0,
      });

    expect(response.status).toEqual(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: "Users number is required",
      })
    );
  });

  it("Should receive an error if miss goal", async () => {
    const response = await request(app)
      .patch("/campaigns/10/ux")
      .set("Authorization", "Bearer admin")
      .send({
        usersNumber: 6,
        sentiments: [],
        questions: [],
        methodology,
        visible: 0,
      });

    expect(response.status).toEqual(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: "Goal is required",
      })
    );
  });

  it("Should raise an error if body is empty", async () => {
    const response = await request(app)
      .patch("/campaigns/10/ux")
      .set("Authorization", "Bearer admin")
      .send({});

    expect(response.status).toEqual(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: "Body is invalid",
      })
    );
  });
});
