import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
import useBasicData from "./useBasicData";

const bug = {
  title: "Campaign Title",
  description: "Camapign Description",
  expected: "The expected to reproduce the bug",
  current: "Current case",
  severity: "LOW",
  replicability: "ONCE",
  type: "CRASH",
  notes: "The bug notes",
  lastSeen: "2022-07-01T13:44:00.000+02:00",
  usecase: 1,
  device: 1,
  media: ["www.example.com/media69.jpg", "www.example.com/media6969.jpg"],
};

describe("Route POST a bug to a specific campaign - unavailable", () => {
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
      .post("/users/me/campaigns/1/bugs")
      .set("authorization", "Bearer tester")
      .send(bug);
    expect(response.status).toBe(404);
  });
});
