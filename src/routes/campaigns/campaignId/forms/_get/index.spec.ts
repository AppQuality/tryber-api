import request from "supertest";
import app from "@src/app";
import preselectionForm from "@src/__mocks__/mockedDb/preselectionForm";
import preselectionFormFields from "@src/__mocks__/mockedDb/preselectionFormFields";
describe("GET /campaigns/forms ", () => {
  beforeAll(async () => {
    await preselectionForm.insert({ id: 1, name: "Form Name1" });
    await preselectionFormFields.insert({ id: 1, question: "Question Name1" });
    await preselectionFormFields.insert({
      id: 2,
      question: "Question Name2",
      short_name: "question_short_2",
      priority: 2,
    });
    await preselectionFormFields.insert({
      id: 3,
      question: "Question Name3",
      short_name: "question_short_3",
      priority: 1,
    });
  });
  afterAll(async () => {
    await preselectionForm.clear();
    await preselectionFormFields.clear();
  });
  it("should answer 403 if user is not logged in ", async () => {
    const response = await request(app).get("/campaigns/1/forms/");
    expect(response.status).toBe(403);
  });
  it("should answer 403 if user is logged in without olp appq_tester_selection", async () => {
    const response = await request(app)
      .get("/campaigns/1/forms/")
      .set("authorization", `Bearer tester`);
    expect(response.status).toBe(403);
  });
  it("should answer 200 if user is logged in and has olp appq_tester_selection ", async () => {
    const response = await request(app)
      .get("/campaigns/1/forms/")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.status).toBe(200);
  });
  it("should return 403 if user does not have access to campaign", async () => {
    const response = await request(app)
      .get("/campaigns/1/forms/")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":[2]}`);
    expect(response.status).toBe(403);
  });
  it("should return 200 if user has access to single campaign", async () => {
    const response = await request(app)
      .get("/campaigns/1/forms/")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":[1]}`);
    expect(response.status).toBe(200);
  });
  it("should return questions", async () => {
    const response = await request(app)
      .get("/campaigns/1/forms/")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.body.length).toBe(3);
    expect(response.body).toEqual(
      expect.arrayContaining([
        { id: 1, question: "Question Name1" },
        { id: 2, question: "Question Name2", short_name: "question_short_2" },
        { id: 3, question: "Question Name3", short_name: "question_short_3" },
      ])
    );
  });
  it("should return questions ordered by priority", async () => {
    const response = await request(app)
      .get("/campaigns/1/forms/")
      .set(
        "authorization",
        `Bearer tester olp    {"appq_tester_selection":true}`
      );
    expect(response.body.length).toBe(3);
    expect(response.body[0]).toHaveProperty("id", 1);
    expect(response.body[1]).toHaveProperty("id", 3);
    expect(response.body[2]).toHaveProperty("id", 2);
  });
});
describe("GET /campaigns/forms when no data", () => {
  it("should answer 403 if there are no data", async () => {
    const response = await request(app)
      .get("/campaigns/1/forms/")
      .set("authorization", `Bearer tester olp {"appq_tester_selection":true}`);
    expect(response.status).toBe(404);
  });
});
