import app from "@src/app";
import request from "supertest";
import { tryber } from "@src/features/database";

describe("GET users/me/campaigns/:cId/preview - Page Version 2", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().insert({
      id: 1,
      wp_user_id: 1,
      name: "John",
      surname: "Doe",
      email: "john.doe@example.com",
      employment_id: 1,
      education_id: 1,
    });
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      buildCampaignRow({ id: 1, version: "v2", isPublic: 4 }), // 4 = target group
      buildCampaignRow({ id: 2, version: "v1", isPublic: 1 }), // 1 = public
    ]);
    await tryber.tables.CampaignDossierData.do().insert([
      {
        id: 1,
        campaign_id: 1,
        link: "http://example.com/dossier1",
        created_by: 11111,
        updated_by: 11111,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
    await tryber.tables.CampaignDossierData.do().delete();
  });

  it("Should return 403 if user is not authenticated", async () => {
    const response = await request(app).get("/users/me/campaigns/1/preview");
    expect(response.status).toBe(403);
  });
  it("Should return 404 if campaign does not exists", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/100/preview")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(404);
  });
  describe("Campaign V1", () => {
    it("Should return 404 if campaign is V1 as tester", async () => {
      const response = await request(app)
        .get("/users/me/campaigns/2/preview")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(404);
      expect(response.body).toMatchObject(
        expect.objectContaining({ message: "Preview not found" })
      );
    });
    it("Should return 404 if campaign is V1 as admin", async () => {
      const response = await request(app)
        .get("/users/me/campaigns/2/preview")
        .set("Authorization", "Bearer admin");
      expect(response.status).toBe(404);
      expect(response.body).toMatchObject(
        expect.objectContaining({ message: "Preview not found" })
      );
    });
  });

  describe("Campaign V2", () => {
    describe("As admin", () => {
      it("Should return 200 if campaign is V2", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/preview")
          .set("Authorization", "Bearer admin");
        expect(response.status).toBe(200);
      });
    });
    describe("As tester NOT in target - targetGroup", () => {
      beforeEach(async () => {
        await tryber.tables.CampaignDossierDataAge.do().insert({
          campaign_dossier_data_id: 1,
          min: 18,
          max: 20,
        });
      });
      afterEach(async () => {
        await tryber.tables.CampaignDossierDataAge.do().delete();
      });
      it("Should return 404 ", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/preview")
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(404);
        expect(response.body).toMatchObject(
          expect.objectContaining({ message: "Campaign not found" })
        );
      });
    });
    describe("As tester in target - targetGroup", () => {
      beforeEach(async () => {
        await tryber.tables.CampaignDossierDataAge.do().insert({
          campaign_dossier_data_id: 1,
          min: 50,
          max: 70,
        });
      });
      afterEach(async () => {
        await tryber.tables.CampaignDossierDataAge.do().delete();
      });
      it("Should return 200 ", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/preview")
          .set("Authorization", "Bearer tester");
        expect(response.status).toBe(200);
      });
      // it("Should return preview data ", async () => {
      //   const response = await request(app)
      //     .get("/users/me/campaigns/1/preview")
      //     .set("Authorization", "Bearer tester");
      //   expect(response.status).toBe(200);
      // });
    });
  });
});

function buildCampaignRow({
  id,
  version,
  isPublic,
}: {
  id: number;
  version: "v1" | "v2";
  isPublic?: number;
}) {
  return {
    id,
    is_public: isPublic,
    start_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    platform_id: 1,
    // new date il 5 days in the future
    end_date: new Date(new Date().getTime() + 12 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    page_version: version,
    title: `Campaign ${id}`,
    customer_title: `Campaign ${id} Customer Title`,
    page_preview_id: version === "v2" ? 0 : 1234,
    page_manual_id: version === "v2" ? 0 : 1234,
    customer_id: 1,
    pm_id: 11111,
    project_id: 1,
  };
}
