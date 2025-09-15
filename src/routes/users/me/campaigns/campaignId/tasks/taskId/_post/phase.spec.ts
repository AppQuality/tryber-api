import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
import useBasicData from "../../../_get/useBasicData";

describe("Route POST /users/me/campaigns/{campaignId}/tasks/{taskId} - cp phase check", () => {
  useBasicData();
  beforeAll(async () => {
    await tryber.tables.WpAppqUserTask.do().insert({
      id: 1,
      tester_id: 1,
      task_id: 1,
      is_completed: 0,
    });
    await tryber.tables.WpAppqEvdCampaign.do()
      .update({
        phase_id: 1, // Draft
      })
      .where({
        id: 1,
      });
  });

  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqUserTask.do().delete();
  });

  it("Should return 404 if campaign is unavailable", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/tasks/1")
      .send({ status: "completed" })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(404);
  });
});
