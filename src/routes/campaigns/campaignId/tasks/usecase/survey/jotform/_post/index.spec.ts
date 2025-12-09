import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

jest.mock("@src/features/jotform", () => {
  return jest.fn().mockImplementation(() => {
    return {
      getForm: async () => {
        return {
          questions: [
            {
              id: "1",
              text: "Question 1",
            },
          ],
          submissions: [
            {
              id: "1",
              answers: {
                "1": "Answer 1",
              },
            },
          ],
          createdAt: "1985-10-26 01:21:00",
        };
      },
    };
  });
});

describe("POST /campaigns/{campaignId}/tasks/{usecase}/survey/jotform", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().insert({
      id: 1,
      wp_user_id: 1,
      name: "Tester",
      email: "",
      education_id: 1,
      employment_id: 1,
    });
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 1,
      title: "Test Campaign",
      platform_id: 1,
      start_date: "2021-01-01",
      end_date: "2021-12-31",
      close_date: "2021-12-31",
      page_preview_id: 1,
      page_manual_id: 1,
      customer_id: 1,
      pm_id: 1,
      project_id: 1,
      customer_title: "Test Customer",
    });
    await tryber.tables.WpAppqCampaignTask.do().insert({
      id: 2,
      campaign_id: 1,
      title: "Test Usecase",
      content: "",
      jf_code: "",
      jf_text: "",
      is_required: 0,
      simple_title: "",
      info: "",
      prefix: "",
    });
  });
  afterEach(async () => {
    await tryber.tables.WpAppqCampaignPreselectionForm.do().delete();
    await tryber.tables.WpAppqCampaignPreselectionFormFields.do().delete();
    await tryber.tables.WpAppqCampaignPreselectionFormData.do().delete();
    await tryber.tables.UsecaseSurveyQuestions.do().delete();
  });
  it("should answer 403 if user is not logged in ", async () => {
    const response = await request(app)
      .post("/campaigns/1/tasks/2/survey/jotform")
      .send({ jotformId: "1", testerQuestionId: "testerId" });
    expect(response.status).toBe(403);
  });
  it("should answer 403 if user is logged in without manage_preselection_forms ", async () => {
    const response = await request(app)
      .post("/campaigns/1/tasks/2/survey/jotform")
      .send({ jotformId: "1", testerQuestionId: "testerId" })
      .set("authorization", `Bearer tester`);
    expect(response.status).toBe(403);
  });
  it("should answer 400 if user is logged with permission but campaign does not exists", async () => {
    const response = await request(app)
      .post("/campaigns/10/tasks/2/survey/jotform")
      .send({ jotformId: "1", testerQuestionId: "testerId" })
      .set("authorization", `Bearer tester olp {"appq_campaign":[1]}`);
    expect(response.status).toBe(400);
  });
  it("should return 200 if user is logged in with manage_preselection_forms permission", async () => {
    const response = await request(app)
      .post("/campaigns/1/tasks/2/survey/jotform")
      .send({
        jotformId: "233612113173343",
        testerQuestionId: "ltstronggttryberIdltstronggt",
      })
      .set("authorization", `Bearer tester olp {"appq_campaign":[1]}`);

    console.log(response.body);
    expect(response.status).toBe(200);
  });
});
