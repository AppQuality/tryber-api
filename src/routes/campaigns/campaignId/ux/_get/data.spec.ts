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
describe("GET /campaigns/{campaignId}/ux - data", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      { ...campaign, id: 10, campaign_type_id: 10 },
    ]);
    await tryber.tables.WpAppqCampaignType.do().insert([
      {
        id: 1,
        name: "UX Generic",
        category_id: 1,
      },
      {
        id: 10,
        name: "Usability Test",
        category_id: 1,
        description: "Ux Description",
      },
    ]);
    await tryber.tables.WpAppqCampaignTask.do().insert([
      {
        ...cluster,
        id: 1,
        campaign_id: 10,
        title: "Test Cluster",
      },
      {
        ...cluster,
        id: 2,
        campaign_id: 10,
        title: "Test Cluster 2",
      },
      {
        ...cluster,
        id: 3,
        campaign_id: 2,
        title: "Test Cluster 3",
      },
    ]);
    await tryber.tables.UxCampaignQuestions.do().insert([
      {
        campaign_id: 10,
        question: "Why the world is round?",
      },
      {
        campaign_id: 10,
        question: "How many stars are in the sky?",
      },
      {
        campaign_id: 20,
        question: "How many stars are in the universe?",
      },
      {
        campaign_id: 20,
        question: "Be or not to be?",
      },
    ]);
    await tryber.tables.UxCampaignSentiments.do().insert([
      {
        cluster_id: 1,
        campaign_id: 10,
        value: 1,
        comment: "Low Comment cluster1",
      },
      {
        cluster_id: 2,
        campaign_id: 10,
        value: 5,
        comment: "High Comment cluster2",
      },
      {
        cluster_id: 1,
        campaign_id: 2,
        value: 5,
        comment: "Medium Comment cluster1",
      },
      {
        cluster_id: 1,
        campaign_id: 20,
        value: 5,
        comment: "Medium Comment cluster1",
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.WpAppqCampaignTask.do().delete();
    await tryber.tables.UxCampaignQuestions.do().delete();
    await tryber.tables.UxCampaignSentiments.do().delete();
  });

  describe("Not published", () => {
    beforeAll(async () => {
      await tryber.tables.UxCampaignData.do().insert([
        {
          campaign_id: 20,
          published: 0,
          methodology_description: "Ux Description DATA",
          methodology_type: "qualitative",
          goal: "This is the goal of the reasearch",
          users: 100,
        },
        {
          campaign_id: 10,
          published: 0,
          methodology_description: "Ux Description DATA",
          methodology_type: "qualitative",
          goal: "This is the goal of the reasearch",
          users: 99,
        },
      ]);
    });
    afterAll(async () => {
      await tryber.tables.UxCampaignData.do().delete();
    });
    it("Should return the questions", async () => {
      const response = await request(app)
        .get("/campaigns/10/ux")
        .set("Authorization", "Bearer admin");
      expect(response.body).toHaveProperty("questions");
      expect(Array.isArray(response.body.questions)).toBe(true);
    });
    it("Should return all the questions", async () => {
      const response = await request(app)
        .get("/campaigns/10/ux")
        .set("Authorization", "Bearer admin");
      expect(response.body.questions).toHaveLength(2);
      expect(response.body.questions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Why the world is round?",
          }),
          expect.objectContaining({
            name: "How many stars are in the sky?",
          }),
        ])
      );
    });

    it("Should return all sentiments when values are greater than 0 and less than 6", async () => {
      const response = await request(app)
        .get("/campaigns/10/ux")
        .set("Authorization", "Bearer admin");
      expect(response.body.sentiments).toHaveLength(2);
      expect(response.body.sentiments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            value: 1,
            comment: "Low Comment cluster1",
            cluster: {
              id: 1,
              name: "Test Cluster",
            },
          }),
          expect.objectContaining({
            value: 5,
            comment: "High Comment cluster2",
            cluster: {
              id: 2,
              name: "Test Cluster 2",
            },
          }),
        ])
      );
    });

    it("Should return methodology", async () => {
      const response = await request(app)
        .get("/campaigns/10/ux")
        .set("Authorization", "Bearer admin");
      expect(response.body).toHaveProperty("methodology");
    });

    it("Should return methodology name", async () => {
      const response = await request(app)
        .get("/campaigns/10/ux")
        .set("Authorization", "Bearer admin");
      expect(response.body.methodology).toHaveProperty("name");
      expect(response.body.methodology.name).toEqual("Usability Test");
    });

    it("Should return methodology description from ux data if exist", async () => {
      const response = await request(app)
        .get("/campaigns/10/ux")
        .set("Authorization", "Bearer admin");
      expect(response.body.methodology).toHaveProperty("description");
      expect(response.body.methodology.description).toEqual(
        "Ux Description DATA"
      );
    });

    it("Should return methodology type", async () => {
      const response = await request(app)
        .get("/campaigns/10/ux")
        .set("Authorization", "Bearer admin");
      expect(response.body.methodology).toHaveProperty("type");
      expect(response.body.methodology.type).toEqual("qualitative");
    });
    it("Should return research goal", async () => {
      const response = await request(app)
        .get("/campaigns/10/ux")
        .set("Authorization", "Bearer admin");
      expect(response.body).toHaveProperty("goal");
      expect(response.body.goal).toEqual("This is the goal of the reasearch");
    });
    it("Should return research usersNumber", async () => {
      const response = await request(app)
        .get("/campaigns/10/ux")
        .set("Authorization", "Bearer admin");
      expect(response.body).toHaveProperty("usersNumber");
      expect(response.body.usersNumber).toEqual(99);
    });
    it("Should return visible status", async () => {
      const response = await request(app)
        .get("/campaigns/10/ux")
        .set("Authorization", "Bearer admin");
      expect(response.body).toHaveProperty("visible");
      expect(response.body.visible).toEqual(0);
    });
  });

  describe("Published", () => {
    beforeAll(async () => {
      await tryber.tables.UxCampaignData.do().insert([
        {
          campaign_id: 20,
          published: 1,
          methodology_description: "Ux Description DATA",
          methodology_type: "qualitative",
          goal: "This is the goal of the reasearch",
          users: 100,
        },
        {
          campaign_id: 10,
          published: 1,
          methodology_description: "Ux Description DATA",
          methodology_type: "qualitative",
          goal: "This is the goal of the reasearch",
          users: 99,
        },
      ]);
    });
    afterAll(async () => {
      await tryber.tables.UxCampaignData.do().delete();
    });
    it("Should return the questions", async () => {
      const response = await request(app)
        .get("/campaigns/10/ux")
        .set("Authorization", "Bearer admin");
      expect(response.body).toHaveProperty("questions");
      expect(Array.isArray(response.body.questions)).toBe(true);
    });
    it("Should return all the questions", async () => {
      const response = await request(app)
        .get("/campaigns/10/ux")
        .set("Authorization", "Bearer admin");
      expect(response.body.questions).toHaveLength(2);
      expect(response.body.questions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Why the world is round?",
          }),
          expect.objectContaining({
            name: "How many stars are in the sky?",
          }),
        ])
      );
    });

    it("Should return all sentiments when values are greater than 0 and less than 6", async () => {
      const response = await request(app)
        .get("/campaigns/10/ux")
        .set("Authorization", "Bearer admin");
      expect(response.body.sentiments).toHaveLength(2);
      expect(response.body.sentiments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            value: 1,
            comment: "Low Comment cluster1",
            cluster: {
              id: 1,
              name: "Test Cluster",
            },
          }),
          expect.objectContaining({
            value: 5,
            comment: "High Comment cluster2",
            cluster: {
              id: 2,
              name: "Test Cluster 2",
            },
          }),
        ])
      );
    });

    it("Should return methodology", async () => {
      const response = await request(app)
        .get("/campaigns/10/ux")
        .set("Authorization", "Bearer admin");
      expect(response.body).toHaveProperty("methodology");
    });

    it("Should return methodology name", async () => {
      const response = await request(app)
        .get("/campaigns/10/ux")
        .set("Authorization", "Bearer admin");
      expect(response.body.methodology).toHaveProperty("name");
      expect(response.body.methodology.name).toEqual("Usability Test");
    });

    it("Should return methodology description from ux data if exist", async () => {
      const response = await request(app)
        .get("/campaigns/10/ux")
        .set("Authorization", "Bearer admin");
      expect(response.body.methodology).toHaveProperty("description");
      expect(response.body.methodology.description).toEqual(
        "Ux Description DATA"
      );
    });

    it("Should return methodology type", async () => {
      const response = await request(app)
        .get("/campaigns/10/ux")
        .set("Authorization", "Bearer admin");
      expect(response.body.methodology).toHaveProperty("type");
      expect(response.body.methodology.type).toEqual("qualitative");
    });
    it("Should return research goal", async () => {
      const response = await request(app)
        .get("/campaigns/10/ux")
        .set("Authorization", "Bearer admin");
      expect(response.body).toHaveProperty("goal");
      expect(response.body.goal).toEqual("This is the goal of the reasearch");
    });
    it("Should return research usersNumber", async () => {
      const response = await request(app)
        .get("/campaigns/10/ux")
        .set("Authorization", "Bearer admin");
      expect(response.body).toHaveProperty("usersNumber");
      expect(response.body.usersNumber).toEqual(99);
    });
    it("Should return visible status", async () => {
      const response = await request(app)
        .get("/campaigns/10/ux")
        .set("Authorization", "Bearer admin");
      expect(response.body).toHaveProperty("visible");
      expect(response.body.visible).toEqual(1);
    });
  });
});
