import app from "@src/app";
import request from "supertest";
import useBasicData from "./useBasicData";

describe("Route PUT /users/me/languages/", () => {
  useBasicData();
  it("Should return 403 if user is not logged in", () => {
    return request(app).put("/users/me/languages/").expect(403);
  });
  it("Should return 403 if user is not logged in", async () => {
    const res = await request(app).put("/users/me/languages/");
    expect(res.status).toBe(403);
  });
  it("Should return 404 if user is logged in but not selected", () => {
    return request(app)
      .put("/users/me/campaigns/100")
      .set("Authorization", "Bearer tester")
      .expect(404);
  });

  it("Should return 404 if languages does not exist", async () => {
    const response = await request(app)
      .put("/users/me/languages/")
      .send([3, 69])
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      element: "element",
      id: 1,
      message: "Bad request: lang_id=69 not found.",
    });
  });

  it("Should return 200 if user is logged", async () => {
    const response = await request(app)
      .put("/users/me/languages/")
      .send([3, 5])
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 3,
        }),
        expect.objectContaining({
          id: 5,
        }),
      ])
    );
  });

  it("Should return empty array if send empty array", async () => {
    const response = await request(app)
      .put("/users/me/languages/")
      .send([])
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
