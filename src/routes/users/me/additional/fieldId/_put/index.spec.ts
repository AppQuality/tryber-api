import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("PUT /users/me/additional/fieldId", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqCustomUserField.do().insert([
      {
        id: 1,
        enabled: 1,
        name: "test",
        slug: "test",
        placeholder: "",
        extras: "1",
        type: "text",
        custom_user_field_group_id: 0,
      },
      {
        id: 2,
        enabled: 0,
        name: "test",
        slug: "test",
        placeholder: "",
        extras: "1",
        type: "text",
        custom_user_field_group_id: 0,
      },
      {
        id: 3,
        enabled: 1,
        type: "select",
        name: "test",
        slug: "test",
        placeholder: "",
        extras: "1",
        custom_user_field_group_id: 0,
      },
    ]);
    await tryber.tables.WpAppqCustomUserFieldExtras.do().insert({
      id: 1,
      custom_user_field_id: 3,
      name: "test",
    });
  });
  it("should answer 403 if not logged in", () => {
    return request(app).put("/users/me/additionals/1").expect(403);
  });
  it("should answer 200 if logged in", async () => {
    const response = await request(app)
      .put("/users/me/additionals/1")
      .set("authorization", "Bearer tester")
      .send({ value: "test" });
    console.log(response.body);
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
