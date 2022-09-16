import request from "supertest";
import app from "@src/app";
import preselectionForm from "@src/__mocks__/mockedDb/preselectionForm";
describe("GET /campaigns/forms ", () => {
  beforeAll(async () => {
    await preselectionForm.insert({ id: 1, name: "Form Name1" });
    await preselectionForm.insert({ id: 2, name: "Form Name2" });
    await preselectionForm.insert({
      id: 3,
      name: "Form Name3 with campaign Id",
      campaign_id: 1,
    });
    await preselectionForm.insert({
      id: 4,
      name: "Form Name4 with campaign Id",
      campaign_id: 1,
    });
    await preselectionForm.insert({
      id: 5,
      name: "Form Name5 with campaign Id",
      campaign_id: 1,
    });
  });
  afterAll(async () => {
    await preselectionForm.clear();
  });
  it("should answer 403 if user is not logged in ", async () => {
    const response = await request(app).get("/campaigns/forms/");
    expect(response.status).toBe(403);
  });
  it("should answer 403 if user is logged in without manage_preselection_forms ", async () => {
    const response = await request(app)
      .get("/campaigns/forms/")
      .set("authorization", `Bearer tester`);
    expect(response.status).toBe(403);
  });
  it("should return 200 if user is logged in with manage_preselection_forms permission", async () => {
    const response = await request(app)
      .get("/campaigns/forms/")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.status).toBe(200);
  });
  it("should return all forms if user is authorized", async () => {
    const response = await request(app)
      .get("/campaigns/forms/")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body).toHaveProperty("results");
    expect(Array.isArray(response.body.results)).toBe(true);
    expect(response.body.results.length).toBe(5);
    expect(response.body.results[0]).toMatchObject({
      id: 1,
      name: "Form Name1",
    });
    expect(response.body.results[1]).toMatchObject({
      id: 2,
      name: "Form Name2",
    });
    expect(response.body.results[2]).toMatchObject({
      id: 3,
      name: "Form Name3 with campaign Id",
      campaign: 1,
    });
    expect(response.body.results[3]).toMatchObject({
      id: 4,
      name: "Form Name4 with campaign Id",
      campaign: 1,
    });
    expect(response.body.results[4]).toMatchObject({
      id: 5,
      name: "Form Name5 with campaign Id",
      campaign: 1,
    });
  });
  it("should return limit if is provided", async () => {
    const response = await request(app)
      .get("/campaigns/forms/?limit=10")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body).toHaveProperty("limit", 10);
  });
  it("should not return limit if is not provided", async () => {
    const response = await request(app)
      .get("/campaigns/forms/")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body).not.toHaveProperty("limit");
  });
  it("should return first form if limit is 1", async () => {
    const response = await request(app)
      .get("/campaigns/forms/?limit=1")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body.results.length).toBe(1);
    expect(response.body.results[0]).toMatchObject({
      id: 1,
      name: "Form Name1",
    });
  });
  it("should return the total number of elements if limit is set", async () => {
    const response = await request(app)
      .get("/campaigns/forms/?limit=1")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body).toHaveProperty("total", 5);
  });
  it("should not return total if limit is not provided", async () => {
    const response = await request(app)
      .get("/campaigns/forms/")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body).not.toHaveProperty("total");
  });
  it("should return start = 0 if start is not provided", async () => {
    const response = await request(app)
      .get("/campaigns/forms/")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body).toHaveProperty("start", 0);
  });
  it("should return start if start is provided", async () => {
    const response = await request(app)
      .get("/campaigns/forms/?start=10")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body).toHaveProperty("start", 10);
  });
  it("should return size if size is not provided", async () => {
    const response = await request(app)
      .get("/campaigns/forms/")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body).toHaveProperty("size", 5);
  });
  it("should return third form if searchBy=id,name and search=3", async () => {
    const response = await request(app)
      .get("/campaigns/forms/?searchBy=id,name&search=3")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body).toHaveProperty("size", 1);
    expect(response.body.results[0]).toMatchObject({
      id: 3,
      name: "Form Name3 with campaign Id",
      campaign: 1,
    });
  });

  it("should return total if limit=2, searchBy=id,name and search=3", async () => {
    const response = await request(app)
      .get("/campaigns/forms/?searchBy=id,name&search=3&limit=2")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body).toHaveProperty("total", 1);
  });
  it("should return limit=1000 if is set start and limit is not provided", async () => {
    const response = await request(app)
      .get("/campaigns/forms/?start=2")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body.results[0].id).toBe(3);
    expect(response.body).toHaveProperty("limit", 1000);
  });
  it("should return the size that is equal to number of results", async () => {
    const response = await request(app)
      .get("/campaigns/forms/?start=2")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body.size).toBe(response.body.results.length);
    const responseStart = await request(app)
      .get("/campaigns/forms/?start=2&limit=2")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(responseStart.body.size).toBe(responseStart.body.results.length);
  });
  it("should return number of skipped elements", async () => {
    const response = await request(app)
      .get("/campaigns/forms/")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body.start).toBe(0);
    const responseStart = await request(app)
      .get("/campaigns/forms/?start=2")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(responseStart.body.start).toBe(2);
  });
  it("should return size=2 and total=3 if searchBy=camapign_id and search=1", async () => {
    const response = await request(app)
      .get("/campaigns/forms/?searchBy=campaign_id&search=1&limit=2")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body.size).toBe(2);
    expect(response.body.total).toBe(3);
  });
});

describe("GET /campaigns/forms when no forms", () => {
  it("should return size = 0 if size is not provided", async () => {
    const response = await request(app)
      .get("/campaigns/forms/")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body).toHaveProperty("size", 0);
  });
  it("should return the total number of elements if limit is set", async () => {
    const response = await request(app)
      .get("/campaigns/forms/?limit=1")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body).toHaveProperty("total");
    expect(response.body.total).toBe(0);
  });
});
