import request from "supertest";
import app from "@src/app";
import customUserFields from "@src/__mocks__/mockedDb/customUserFields";
import customUserFieldExtras from "@src/__mocks__/mockedDb/customUserFieldsExtra";

beforeAll(async () => {
  customUserFields.insert({
    id: 1,
    enabled: 1,
  });
  customUserFields.insert({
    id: 2,
    enabled: 0,
  });
  customUserFields.insert({
    id: 3,
    enabled: 1,
    type: "select",
  });
  customUserFieldExtras.insert({
    id: 1,
    custom_user_field_id: 3,
  });
});
describe("PUT /users/me/additional/fieldId", () => {
  beforeEach(async () => {});
  afterEach(async () => {});
  it("should answer 403 if not logged in", () => {
    return request(app).put("/users/me/additionals/1").expect(403);
  });
  it("should answer 200 if logged in", async () => {
    const response = await request(app)
      .put("/users/me/additionals/1")
      .set("authorization", "Bearer tester")
      .send({ value: "test" });
    expect(response.status).toBe(200);
  });
  it("should answer 200 if logged in for select", async () => {
    const response = await request(app)
      .put("/users/me/additionals/3")
      .set("authorization", "Bearer tester")
      .send({ value: "1" });
    expect(response.status).toBe(200);
  });
  it("should answer 404 if cuf doesn't exists", async () => {
    const response = await request(app)
      .put("/users/me/additionals/100")
      .set("authorization", "Bearer tester")
      .send({ value: "test" });
    expect(response.status).toBe(404);
  });
  it("should answer 404 if cuf is disabled", async () => {
    const response = await request(app)
      .put("/users/me/additionals/2")
      .set("authorization", "Bearer tester")
      .send({ value: "test" });
    expect(response.status).toBe(404);
  });
});
