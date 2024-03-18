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

describe("POST /jotforms/{campaignId}", () => {
  beforeAll(async () => {
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
  });
  afterEach(async () => {
    await tryber.tables.WpAppqCampaignPreselectionForm.do().delete();
    await tryber.tables.WpAppqCampaignPreselectionFormFields.do().delete();
    await tryber.tables.WpAppqCampaignPreselectionFormData.do().delete();
  });
  it("should answer 403 if user is not logged in ", async () => {
    const response = await request(app)
      .post("/jotforms/1")
      .send({ formId: "1", testerIdColumn: "testerId" });
    expect(response.status).toBe(403);
  });
  it("should answer 403 if user is logged in without manage_preselection_forms ", async () => {
    const response = await request(app)
      .post("/jotforms/1")
      .send({ formId: "1", testerIdColumn: "testerId" })
      .set("authorization", `Bearer tester`);
    expect(response.status).toBe(403);
  });
  it("should answer 403 if user is logged with permission but campaign does not exists", async () => {
    const response = await request(app)
      .post("/jotforms/10")
      .send({ formId: "1", testerIdColumn: "testerId" })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(403);
  });
  it("should return 200 if user is logged in with manage_preselection_forms permission", async () => {
    const response = await request(app)
      .post("/jotforms/1")
      .send({
        formId: "233612113173343",
        testerIdColumn: "ltstronggttryberIdltstronggt",
      })
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(200);
  });
});
