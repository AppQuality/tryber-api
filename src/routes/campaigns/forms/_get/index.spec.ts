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
    expect(response.body.results.length).toBe(3);
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
  it("should not return limit if is not  provided", async () => {
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
  it("Should return the total number of elements if limit is set", async () => {
    const response = await request(app)
      .get("/campaigns/forms/?limit=1")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body).toHaveProperty("total");
    expect(response.body.total).toBe(3);
  });
  it("should not return total if limit is not  provided", async () => {
    const response = await request(app)
      .get("/campaigns/forms/")
      .set(
        "authorization",
        `Bearer tester capability ["manage_preselection_forms"]`
      );
    expect(response.body).not.toHaveProperty("total");
  });
});
