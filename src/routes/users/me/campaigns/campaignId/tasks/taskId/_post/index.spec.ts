import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
import useBasicData from "../../../_get/useBasicData";

describe("Route GET /users/me/campaigns/{campaignId}/", () => {
  useBasicData();
  it("Should return 403 if user is not logged in", async () => {
    const res = await request(app).get("/users/me/campaigns/1");
    expect(res.status).toBe(403);
  });
  it("Should return 404 if user is logged in but not selected", async () => {
    const res = await request(app)
      .get("/users/me/campaigns/2")
      .set("Authorization", "Bearer tester");
    expect(res.status).toBe(404);
  });
  it("Should return 200 if user is logged and selected", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
});
