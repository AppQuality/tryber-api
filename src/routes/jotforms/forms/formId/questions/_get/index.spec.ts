import app from "@src/app";
import request from "supertest";

jest.mock("@src/features/jotform", () => {
  return jest.fn().mockImplementation(() => {
    return {
      getFormQuestions: async () => {
        return [
          {
            id: "1",
            type: "control_textbox",
            title: "Question 1",
            description: "Description",
            name: "question1",
          },
        ];
      },
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
        };
      },
    };
  });
});

describe("GET /jotforms/forms/{formId}/questions", () => {
  it("should answer 403 if user is not logged in ", async () => {
    const response = await request(app).get(
      "/jotforms/forms/240185802836357/questions"
    );
    expect(response.status).toBe(403);
  });
  it("should answer 403 if user is logged in without manage_preselection_forms ", async () => {
    const response = await request(app)
      .get("/jotforms/forms/240185802836357/questions")
      .set("authorization", `Bearer tester`);
    expect(response.status).toBe(403);
  });
  it("should return 200 if user is logged in with manage_preselection_forms permission", async () => {
    const response = await request(app)
      .get("/jotforms/forms/240185802836357/questions")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    console.log(response.body);
    expect(response.status).toBe(200);
  });
});
