import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
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
  ]);
  await tryber.tables.WpUsers.do().insert([{ ID: 2 }]);

  await tryber.tables.WpAppqEvdProfile.do().insert([
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
  await tryber.tables.WpUsers.do().insert([{ ID: 3 }]);

  await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
    {
      campaign_id: 1,
      user_id: 2,
      accepted: 1,
      devices: "0",
      selected_device: 1,
      results: 0,
      group_id: 1,
    },
  ]);

  await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
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

  await tryber.tables.WpAppqExpPoints.do().insert([
    {
      campaign_id: 1,
      activity_id: 1,
      tester_id: 1,
      reason: "",
      pm_id: 1,
    },
  ]);
  await tryber.tables.WpAppqPayment.do().insert([
    {
      campaign_id: 1,
      work_type_id: 1,
      tester_id: 3,
    },
  ]);
});

describe("GET /campaigns/campaignId/prospect - payment status", () => {
  it("Should return done for paid testers", async () => {
    const response = await request(app)
      .get("/campaigns/1/prospect")
      .set("Authorization", "Bearer admin");
    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester: { id: 1, name: "John", surname: "Doe", group: 1 },
          status: "done",
        }),
        expect.objectContaining({
          tester: { id: 2, name: "John", surname: "Doe", group: 1 },
          status: "pending",
        }),
        expect.objectContaining({
          tester: { id: 3, name: "John", surname: "Doe", group: 1 },
          status: "done",
        }),
      ])
    );
  });
});
