import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
import useBasicData from "./useBasicData";

describe("Route GET /users/me/campaigns/{campaignId}/ - bug language set", () => {
  useBasicData();
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do()
      .update({
        phase_id: 1,
      })
      .where({
        id: 1,
      });
  });

  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
  });

  it("Should return 404 if campaign is unavailable", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(404);
  });
});
