import request from "supertest";
import app from "@src/app";
import useCampaign from "./useCampaign";
import { tryber } from "@src/features/database";

useCampaign();

beforeAll(async () => {
  await tryber.tables.WpAppqEvdProfile.do().insert([
    {
      // tester che ha completato al 100% la campagna - il default è 75%
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

  await tryber.tables.WpAppqExpPoints.do().insert([
    {
      campaign_id: 1,
      activity_id: 1,
      tester_id: 1,
      reason: "",
      pm_id: 1,
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
          tester: { id: 1, name: "John", surname: "Doe" },
          status: "done",
        }),
        expect.objectContaining({
          tester: { id: 2, name: "John", surname: "Doe" },
          status: "pending",
        }),
      ])
    );
  });
});
