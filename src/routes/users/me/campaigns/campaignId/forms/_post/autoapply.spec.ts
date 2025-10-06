import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const campaign = {
  start_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  end_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  title: "Cp",
  customer_title: "Cp",
  is_public: 1,
  os: "1,2",
  platform_id: 1,
  page_preview_id: 1,
  page_manual_id: 1,
  pm_id: 1,
  project_id: 1,
  customer_id: 1,
};
describe("POST users/me/campaigns/:campaignId/forms - auto apply", () => {
  beforeEach(async () => {
    await tryber.tables.WpAppqEvdProfile.do().insert({
      id: 1,
      wp_user_id: 1,
      email: "",
      employment_id: 1,
      education_id: 1,
    });
    await tryber.tables.WpCrowdAppqDevice.do().insert({
      id: 1,
      id_profile: 1,
      enabled: 1,
      platform_id: 1,
    });
  });

  afterEach(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpCrowdAppqDevice.do().delete();
    await tryber.tables.WpAppqExpPoints.do().delete();
    await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
  });
  describe("With auto apply", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqEvdCampaign.do().insert({
        ...campaign,
        id: 1,
        auto_apply: 1,
      });
    });
    afterEach(async () => {
      await tryber.tables.WpAppqEvdCampaign.do().delete();
    });
    it("Should auto candidate", async () => {
      const response = await request(app)
        .post("/users/me/campaigns/1/forms")
        .send({
          device: [1],
        })
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);

      const application = await tryber.tables.WpCrowdAppqHasCandidate.do()
        .where({
          campaign_id: 1,
          user_id: 1,
        })
        .first();

      expect(application).toBeDefined();
      expect(application?.accepted).toBe(1);
    });
  });
  describe("Without auto apply", () => {
    beforeEach(async () => {
      await tryber.tables.WpAppqEvdCampaign.do().insert({
        ...campaign,
        id: 1,
        auto_apply: 0,
      });
    });
    afterEach(async () => {
      await tryber.tables.WpAppqEvdCampaign.do().delete();
    });
    it("Should not auto candidate", async () => {
      const response = await request(app)
        .post("/users/me/campaigns/1/forms")
        .send({
          device: [1],
        })
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);

      const application = await tryber.tables.WpCrowdAppqHasCandidate.do()
        .where({
          campaign_id: 1,
          user_id: 1,
        })
        .first();

      expect(application).toBeDefined();
      expect(application?.accepted).toBe(0);
    });
  });
});
