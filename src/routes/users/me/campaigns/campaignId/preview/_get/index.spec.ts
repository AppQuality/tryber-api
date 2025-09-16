import app from "@src/app";
import request from "supertest";
import { tryber } from "@src/features/database";

const initialConfig = require("@src/config");
describe("GET users/me/campaigns/:cId/preview - Page Version 2", () => {
  beforeAll(async () => {
    jest.mock("@src/config", () => ({
      testerLeaderCPV2: { name: "tlName", email: "tlEmail" },
    }));

    await tryber.tables.WpAppqCampaignType.do().insert([
      {
        id: 1,
        name: "Campaign Type 1",
        category_id: 1,
      },
      {
        id: 2,
        name: "Campaign Type 2",
        category_id: 1,
      },
    ]);
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        id: 1,
        wp_user_id: 1,
        name: "John",
        surname: "Doe",
        email: "john.doe@example.com",
        employment_id: 1,
        education_id: 1,
      },
    ]);
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      buildCampaignRow({ id: 1, version: "v2", isPublic: 4 }), // 4 = target group
      buildCampaignRow({ id: 2, version: "v1", isPublic: 1, cp_type: 2 }), // 1 = public
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
    await tryber.tables.CampaignPreviews.do().insert({
      id: 1,
      campaign_id: 1,
      content: "<html>Preview Content</html>",
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
    await tryber.tables.CampaignDossierData.do().delete();
    // reset initial config
    jest.mock("@src/config", () => initialConfig);
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
      it("Should return preview data ", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/preview")
          .set("Authorization", "Bearer tester");
        expect(response.body).toHaveProperty(
          "content",
          "<html>Preview Content</html>"
        );
      });
      it("Should return start_date and end_date ", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/preview")
          .set("Authorization", "Bearer tester");
        expect(response.body).toHaveProperty("startDate", "2025-09-17");
        expect(response.body).toHaveProperty("endDate", "2025-09-29");
      });
      it("Should return campaignType ", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/preview")
          .set("Authorization", "Bearer tester");
        expect(response.body).toHaveProperty("campaignType", "Campaign Type 1");
      });
      it("Should return tester leader info ", async () => {
        const response = await request(app)
          .get("/users/me/campaigns/1/preview")
          .set("Authorization", "Bearer tester");
        expect(response.body).toMatchObject(
          expect.objectContaining({
            tl: {
              name: "tlName",
              email: "tlEmail",
            },
          })
        );
      });

      describe("Selection status", () => {
        describe("There is no candidature", () => {
          describe("User role = tester", () => {
            it("Should answer without selectionStatus", async () => {
              const response = await request(app)
                .get("/users/me/campaigns/1/preview")
                .set("Authorization", "Bearer tester");
              expect(response.body).not.toHaveProperty("selectionStatus");
            });
          });
          describe("User role = administrator", () => {
            it("Should answer with selectionStatus = ready", async () => {
              const response = await request(app)
                .get("/users/me/campaigns/1/preview")
                .set("Authorization", "Bearer admin");
              expect(response.body).toHaveProperty("selectionStatus", "ready");
            });
          });
          describe("User role = tester with appq_campaign olp", () => {
            it("Should answer with selectionStatus = ready", async () => {
              const response = await request(app)
                .get("/users/me/campaigns/1/preview")
                .set(
                  "Authorization",
                  'Bearer tester olp {"appq_campaign":[1]}'
                );
              expect(response.body).toHaveProperty("selectionStatus", "ready");
            });
          });
        });

        describe("There is a candidature", () => {
          describe("With accepted = 0", () => {
            beforeEach(async () => {
              await tryber.tables.WpCrowdAppqHasCandidate.do().insert({
                user_id: 1,
                campaign_id: 1,
                accepted: 0,
              });
            });
            afterEach(async () => {
              await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
            });

            describe("User role = tester", () => {
              it("Should not answer with selectionStatus", async () => {
                const response = await request(app)
                  .get("/users/me/campaigns/1/preview")
                  .set("Authorization", "Bearer tester");
                expect(response.body).not.toHaveProperty("selectionStatus");
              });
            });

            describe("User role = administrator", () => {
              it("Should answer with selectionStatus = ready", async () => {
                const response = await request(app)
                  .get("/users/me/campaigns/1/preview")
                  .set("Authorization", "Bearer admin");
                expect(response.body).toHaveProperty(
                  "selectionStatus",
                  "ready"
                );
              });
            });
            describe("User role = tester with appq_campaign olp", () => {
              it("Should answer with selectionStatus = ready", async () => {
                const response = await request(app)
                  .get("/users/me/campaigns/1/preview")
                  .set(
                    "Authorization",
                    'Bearer tester olp {"appq_campaign":[1]}'
                  );
                expect(response.body).toHaveProperty(
                  "selectionStatus",
                  "ready"
                );
              });
            });
          });
          describe("With results = 0", () => {
            beforeEach(async () => {
              await tryber.tables.WpCrowdAppqHasCandidate.do().insert({
                user_id: 1,
                campaign_id: 1,
                accepted: 1,
                results: 0,
              });
            });
            afterEach(async () => {
              await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
            });

            describe("User role = tester", () => {
              it("Should answer with selectionStatus = starting", async () => {
                const response = await request(app)
                  .get("/users/me/campaigns/1/preview")
                  .set("Authorization", "Bearer tester");
                expect(response.body).toHaveProperty(
                  "selectionStatus",
                  "starting"
                );
              });
            });

            describe("User role = administrator", () => {
              it("Should answer with selectionStatus = ready", async () => {
                const response = await request(app)
                  .get("/users/me/campaigns/1/preview")
                  .set("Authorization", "Bearer admin");
                expect(response.body).toHaveProperty(
                  "selectionStatus",
                  "ready"
                );
              });
            });
            describe("User role = tester with appq_campaign olp", () => {
              it("Should answer with selectionStatus = ready", async () => {
                const response = await request(app)
                  .get("/users/me/campaigns/1/preview")
                  .set(
                    "Authorization",
                    'Bearer tester olp {"appq_campaign":[1]}'
                  );
                expect(response.body).toHaveProperty(
                  "selectionStatus",
                  "ready"
                );
              });
            });
          });
          describe("With results = 1", () => {
            beforeEach(async () => {
              await tryber.tables.WpCrowdAppqHasCandidate.do().insert({
                user_id: 1,
                campaign_id: 1,
                accepted: 1,
                results: 1,
              });
            });
            afterEach(async () => {
              await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
            });

            describe("User role = tester", () => {
              it("Should answer with selectionStatus = excluded", async () => {
                const response = await request(app)
                  .get("/users/me/campaigns/1/preview")
                  .set("Authorization", "Bearer tester");
                expect(response.body).toHaveProperty(
                  "selectionStatus",
                  "excluded"
                );
              });
            });
            describe("User role = administrator", () => {
              it("Should answer with selectionStatus = ready", async () => {
                const response = await request(app)
                  .get("/users/me/campaigns/1/preview")
                  .set("Authorization", "Bearer admin");
                expect(response.body).toHaveProperty(
                  "selectionStatus",
                  "ready"
                );
              });
            });
            describe("User role = tester with appq_campaign olp", () => {
              it("Should answer with selectionStatus = ready", async () => {
                const response = await request(app)
                  .get("/users/me/campaigns/1/preview")
                  .set(
                    "Authorization",
                    'Bearer tester olp {"appq_campaign":[1]}'
                  );
                expect(response.body).toHaveProperty(
                  "selectionStatus",
                  "ready"
                );
              });
            });
          });
          describe("With results = 2", () => {
            beforeEach(async () => {
              await tryber.tables.WpCrowdAppqHasCandidate.do().insert({
                user_id: 1,
                campaign_id: 1,
                accepted: 1,
                results: 2,
              });
            });
            afterEach(async () => {
              await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
            });

            describe("User role = tester", () => {
              it("Should answer with selectionStatus = ready", async () => {
                const response = await request(app)
                  .get("/users/me/campaigns/1/preview")
                  .set("Authorization", "Bearer tester");
                expect(response.body).toHaveProperty(
                  "selectionStatus",
                  "ready"
                );
              });
            });

            describe("User role = administrator", () => {
              it("Should answer with selectionStatus = ready", async () => {
                const response = await request(app)
                  .get("/users/me/campaigns/1/preview")
                  .set("Authorization", "Bearer admin");
                expect(response.body).toHaveProperty(
                  "selectionStatus",
                  "ready"
                );
              });
            });
            describe("User role = tester with appq_campaign olp", () => {
              it("Should answer with selectionStatus = ready", async () => {
                const response = await request(app)
                  .get("/users/me/campaigns/1/preview")
                  .set(
                    "Authorization",
                    'Bearer tester olp {"appq_campaign":[1]}'
                  );
                expect(response.body).toHaveProperty(
                  "selectionStatus",
                  "ready"
                );
              });
            });
          });
          describe("With results = 3", () => {
            beforeEach(async () => {
              await tryber.tables.WpCrowdAppqHasCandidate.do().insert({
                user_id: 1,
                campaign_id: 1,
                accepted: 1,
                results: 3,
              });
            });
            afterEach(async () => {
              await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
            });
            describe("User role = tester", () => {
              it("Should answer with selectionStatus = complete", async () => {
                const response = await request(app)
                  .get("/users/me/campaigns/1/preview")
                  .set("Authorization", "Bearer tester");
                expect(response.body).toHaveProperty(
                  "selectionStatus",
                  "complete"
                );
              });
            });
            describe("User role = administrator", () => {
              it("Should answer with selectionStatus = ready", async () => {
                const response = await request(app)
                  .get("/users/me/campaigns/1/preview")
                  .set("Authorization", "Bearer admin");
                expect(response.body).toHaveProperty(
                  "selectionStatus",
                  "ready"
                );
              });
            });
            describe("User role = tester with appq_campaign olp", () => {
              it("Should answer with selectionStatus = ready", async () => {
                const response = await request(app)
                  .get("/users/me/campaigns/1/preview")
                  .set(
                    "Authorization",
                    'Bearer tester olp {"appq_campaign":[1]}'
                  );
                expect(response.body).toHaveProperty(
                  "selectionStatus",
                  "ready"
                );
              });
            });
          });
        });
      });
    });
  });
});

function buildCampaignRow({
  id,
  version,
  isPublic,
  cp_type,
}: {
  id: number;
  version: "v1" | "v2";
  isPublic?: number;
  cp_type?: number;
}) {
  return {
    id,
    is_public: isPublic,
    start_date: "2025-09-17",
    platform_id: 1,
    // new date il 5 days in the future
    end_date: "2025-09-29",
    page_version: version,
    title: `Campaign ${id}`,
    customer_title: `Campaign ${id} Customer Title`,
    page_preview_id: version === "v2" ? 0 : 1234,
    page_manual_id: version === "v2" ? 0 : 1234,
    customer_id: 1,
    pm_id: 11111,
    project_id: 1,
    campaign_type_id: cp_type || 1,
  };
}
