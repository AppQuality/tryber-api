import request from "supertest";
import app from "@src/app";
describe("GET /campaigns/:campaignId", () => {
  it("Should return 400 if the user does not have permission", async () => {
    const response = await request(app)
      .get("/campaigns/999")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(400);
  });
  it("Should return 400 if campaign does not exist", async () => {
    const response = await request(app)
      .get("/campaigns/999")
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(400);
  });
});
