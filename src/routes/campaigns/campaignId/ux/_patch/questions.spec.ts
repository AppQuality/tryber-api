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
  project_id: 1,
  customer_title: "Test Customer",
};

const requestBody = {
  goal: "Test Goal",
  usersNumber: 5,
  sentiments: [],
  methodology: {
    name: "Methodology Name",
    type: "qualitative",
    description: "Methodology Description",
  },
};

describe("PATCH /campaigns/{campaignId}/ux - questions", () => {
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
      name: "UX Generic",
      category_id: 1,
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
  });

  beforeEach(async () => {
    await tryber.tables.UxCampaignQuestions.do().insert([
      {
        campaign_id: 10,
        question: "Is there life on universe?",
      },
      {
        campaign_id: 20,
        question: "Is there life on galaxy?",
      },
    ]);
  });
  afterEach(async () => {
    await tryber.tables.UxCampaignQuestions.do().delete();
  });

  it("Should remove questions if send empty array", async () => {
    await request(app)
      .patch("/campaigns/10/ux")
      .send({ ...requestBody, questions: [] })
      .set("Authorization", "Bearer admin");
    const questions = await tryber.tables.UxCampaignQuestions.do()
      .where({
        campaign_id: 10,
      })
      .select("id");

    expect(questions).toEqual([]);
  });
  it("Should not change questions if not send questions", async () => {
    await request(app)
      .patch("/campaigns/10/ux")
      .send({ ...requestBody })
      .set("Authorization", "Bearer admin");
    const questions = await tryber.tables.UxCampaignQuestions.do()
      .where({
        campaign_id: 10,
      })
      .select();

    expect(questions.length).toEqual(1);
    expect(questions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          question: "Is there life on universe?",
        }),
      ])
    );
  });

  it("Should add questions", async () => {
    await request(app)
      .patch("/campaigns/10/ux")
      .send({
        ...requestBody,
        questions: [
          { name: "Is there life on Mars?" },
          { name: "Is there life on Venus?" },
        ],
      })
      .set("Authorization", "Bearer admin");
    const questions = await tryber.tables.UxCampaignQuestions.do()
      .where({
        campaign_id: 10,
      })
      .select();

    expect(questions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          question: "Is there life on Mars?",
        }),
        expect.objectContaining({
          question: "Is there life on Venus?",
        }),
      ])
    );
  });
});
