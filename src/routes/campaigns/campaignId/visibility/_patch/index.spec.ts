import useBasicData from "../../../../users/me/campaigns/campaignId/_get/useBasicData";
import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("Route PATCH /campaigns/:id/visibility", () => {
  useBasicData();

  describe("Authorizations", () => {
    describe("Not enough permissions", () => {
      it("Should answer 403 if not logged in", async () => {
        const response = await request(app).patch("/campaigns/1/visibility");
        expect(response.status).toBe(403);
      });
      it("Should answer 403 if not admin", async () => {
        const response = await request(app)
          .patch("/campaigns/1/visibility")
          .send({ type: "internal" })
          .set("Authorization", "Bearer tester");

        expect(response.status).toBe(403);
      });
    });

    describe("Enough permissions", () => {
      it("Should answer 200 if admin", async () => {
        const response = await request(app)
          .patch("/campaigns/1/visibility")
          .set("authorization", "Bearer admin")
          .send({ type: "internal" });
        expect(response.status).toBe(200);
      });

      it("Should answer 200 if user has access to the campaign", async () => {
        const response = await request(app)
          .patch("/campaigns/1/visibility")
          .send({ type: "internal" })
          .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
        expect(response.status).toBe(200);
      });

      describe("Checking request and payload", () => {
        describe("Wrong requests", () => {
          it("Should answer 403 if campaign does not exists", async () => {
            const response = await request(app).patch(
              "/campaigns/10/visibility"
            );
            expect(response.status).toBe(403);
          });

          it("Should answer 400 if type does not exists", async () => {
            const response = await request(app)
              .patch("/campaigns/1/visibility")
              .set("authorization", "Bearer admin")
              .send({ type: "invalid" });
            expect(response.status).toBe(400);
          });

          it("Should answer 400 if body parameter is not valid", async () => {
            const response = await request(app)
              .patch("/campaigns/1/visibility")
              .set("authorization", "Bearer admin")
              .send({ invalid: "internal" });
            expect(response.status).toBe(400);
          });

          it("Should answer 400 if body is empty", async () => {
            const response = await request(app)
              .patch("/campaigns/1/visibility")
              .set("authorization", "Bearer admin")
              .send({});
            expect(response.status).toBe(400);
          });

          it("Should answer 404 if the campaign is not found", async () => {
            const response = await request(app)
              .patch("/campaigns/999/visibility")
              .set("authorization", "Bearer admin")
              .send({ type: "internal" });
            console.log(response.body);
            expect(response.status).toBe(404);
          });
        });

        describe("Correct requests", () => {
          it("Should change the visibility to target, that's is_public = 4", async () => {
            const response = await request(app)
              .patch("/campaigns/1/visibility")
              .set("authorization", 'Bearer tester olp {"appq_campaign":[1]}')
              .send({ type: "target" });
            expect(response.status).toBe(200);

            const campaign = await tryber.tables.WpAppqEvdCampaign.do()
              .select("is_public")
              .where({ id: 1 })
              .first();
            expect(campaign?.is_public).toBe(4);
          });

          it("Should change the visibility to internal, that's is_public = 0", async () => {
            const response = await request(app)
              .patch("/campaigns/1/visibility")
              .set("authorization", 'Bearer tester olp {"appq_campaign":[1]}')
              .send({ type: "internal" });
            expect(response.status).toBe(200);

            const campaign = await tryber.tables.WpAppqEvdCampaign.do()
              .select("is_public")
              .where({ id: 1 })
              .first();
            expect(campaign?.is_public).toBe(0);
          });
        });
      });
    });
  });
});
