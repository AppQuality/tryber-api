import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const task = {
  campaign_id: 1,
  cluster_id: 10,
  title: "Campaign Task title",
  simple_title: "Campaign Task simple_title",
  content: "Campaign Task content",
  info: "Campaign Task info",
  prefix: "Campaign Task prefix",
  is_required: 1,
  jf_code: "Campaign Task jf_code",
  jf_text: "Campaign Task jf_text",
};

jest.mock("@src/features/checkUrl", () => ({
  checkUrl: jest.fn().mockImplementation(() => false),
}));

beforeAll(async () => {
  await tryber.tables.WpAppqEvdCampaign.do().insert({
    id: 1,
    platform_id: 1,
    start_date: "2020-01-01",
    end_date: "2020-01-01",
    title: "This is the title",
    page_preview_id: 1,
    page_manual_id: 1,
    pm_id: 1,
    project_id: 1,
    customer_title: "",
    campaign_pts: 200,
  });
  await tryber.tables.WpAppqEvdProfile.do().insert({
    id: 1,
    wp_user_id: 1,
    name: "Tester1",
    email: "jhon.doe@tryber.me",
    employment_id: 1,
    education_id: 1,
  });
  await tryber.tables.WpAppqUsecaseMediaObservations.do().insert([
    {
      id: 1,
      media_id: 1,
      name: "Observation1 name",
      video_ts: 59,
      description: "Observation1 description",
      ux_note: "Observation1 ux_notes",
    },
  ]);
  await tryber.tables.WpAppqUserTaskMedia.do().insert([
    {
      id: 1,
      campaign_task_id: 10,
      user_task_id: 1,
      tester_id: 1,
      location:
        "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    },
  ]);
  await tryber.tables.WpAppqCampaignTask.do().insert([
    {
      ...task,
      id: 10,
      campaign_id: 1,
    },
  ]);
  await tryber.tables.WpAppqUsecaseCluster.do().insert([
    {
      id: 10,
      campaign_id: 1,
      title: "Cluster10 title",
      subtitle: "Cluster10 subtitle",
    },
  ]);
});
describe("GET /campaigns/:campaignId/observations - missing stream url", () => {
  it("Should return items with media", async () => {
    const response = await request(app)
      .get("/campaigns/1/observations")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          media: expect.objectContaining({
            id: 1,
            url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            streamUrl: "",
          }),
        }),
      ])
    );
  });
});
