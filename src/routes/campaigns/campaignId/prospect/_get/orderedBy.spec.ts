import request from "supertest";
import app from "@src/app";
import { tryber } from "@src/features/database";
import useCampaign from "./useCampaign";

useCampaign();

beforeAll(async () => {
  await tryber.tables.WpAppqEvdProfile.do().insert([
    {
      id: 2,
      name: "John",
      surname: "Doe",
      wp_user_id: 2,
      email: "",
      employment_id: 1,
      education_id: 1,
    },
    {
      id: 3,
      name: "John",
      surname: "Doe",
      wp_user_id: 3,
      email: "",
      employment_id: 1,
      education_id: 1,
    },
  ]);
  await tryber.tables.WpUsers.do().insert([{ ID: 2 }, { ID: 3 }]);
  await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
    {
      campaign_id: 1,
      user_id: 2,
      accepted: 1,
      devices: "0",
      selected_device: 1,
      results: 0,
      group_id: 0,
    },
    {
      campaign_id: 1,
      user_id: 3,
      accepted: 1,
      devices: "0",
      selected_device: 1,
      results: 0,
      group_id: 1,
    },
  ]);

  await tryber.tables.WpAppqEvdBug.do().insert([
    {
      status_id: 2,
      campaign_id: 1,
      wp_user_id: 1,
      severity_id: 4,
      reviewer: 0,
      last_editor_id: 0,
    },
    {
      status_id: 2,
      campaign_id: 1,
      wp_user_id: 1,
      severity_id: 2,
      reviewer: 0,
      last_editor_id: 0,
    },
  ]);

  await tryber.tables.WpAppqCampaignTaskGroup.do().insert([
    {
      task_id: 1,
      group_id: 0,
    },
  ]);
  await tryber.tables.WpAppqUserTask.do().insert([
    {
      tester_id: 1,
      task_id: 1,
      is_completed: 1,
    },
    {
      tester_id: 3,
      task_id: 1,
      is_completed: 1,
    },
  ]);
  await tryber.tables.WpAppqCampaignTask.do().insert([
    {
      id: 1,
      campaign_id: 1,
      is_required: 1,
      title: "UC 1",
      content: "",
      jf_code: "",
      jf_text: "",
      simple_title: "UC 1",
      info: "",
      prefix: "",
    },
  ]);
});

describe("GET /campaigns/campaignId/prospect - orderedBy", () => {
  it("Should return prospect rows ordered by TesterID as default", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1],"appq_prospect":[1]}'
      );
    expect(response.body.items.length).toEqual(3);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester: expect.objectContaining({ id: 1 }),
        }),
        expect.objectContaining({
          tester: expect.objectContaining({ id: 2 }),
        }),
        expect.objectContaining({
          tester: expect.objectContaining({ id: 3 }),
        }),
      ])
    );
    expect(
      response.body.items.map((p: { tester: { id: number } }) => p.tester.id)
    ).toEqual([1, 2, 3]);
  });
});
