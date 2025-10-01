import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
describe("Route POST /users/me/campaigns/{campaignId}/tasks/{taskId} - complete", () => {
  beforeAll(async () => {
    await tryber.seeds().campaign_statuses();
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 1,
      title: "Campaign 1",
      platform_id: 1,
      page_manual_id: 1,
      page_preview_id: 1,
      start_date: "2020-01-01 00:00:00",
      end_date: "2030-12-31 23:59:59",
      customer_id: 1,
      pm_id: 1,
      project_id: 1,
      customer_title: "Customer 1",
      phase_id: 20,
    });

    const task = {
      title: "Task",
      content: "Content",
      campaign_id: 1,
      jf_code: "",
      jf_text: "",
      is_required: 1,
      simple_title: "",
      prefix: "",
      info: "",
    };

    await tryber.tables.WpAppqCampaignTask.do().insert([
      {
        ...task,
        id: 1,
      },
      {
        ...task,
        id: 2,
      },
    ]);
  });

  beforeEach(async () => {
    await tryber.tables.WpCrowdAppqHasCandidate.do().insert({
      user_id: 1,
      campaign_id: 1,
      accepted: 1,
      results: 1,
    });
  });

  afterEach(async () => {
    await tryber.tables.WpAppqUserTask.do().delete();
    await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
  });

  it("Should not complete the candidate if user not complete all required tasks", async () => {
    const res = await request(app)
      .post("/users/me/campaigns/1/tasks/1")
      .send({ status: "completed" })
      .set("Authorization", "Bearer tester");

    const candidacy = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .where({
        user_id: 1,
        campaign_id: 1,
      })
      .first();

    expect(candidacy?.results).toBe(1);
  });
  it("Should complete the candidate if user complete all required tasks", async () => {
    await request(app)
      .post("/users/me/campaigns/1/tasks/1")
      .send({ status: "completed" })
      .set("Authorization", "Bearer tester");
    await request(app)
      .post("/users/me/campaigns/1/tasks/2")
      .send({ status: "completed" })
      .set("Authorization", "Bearer tester");

    const candidacy = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .where({
        user_id: 1,
        campaign_id: 1,
      })
      .first();

    expect(candidacy?.results).toBe(3);
  });
});
