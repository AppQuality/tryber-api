import app from "@src/app";
import request from "supertest";
import campaign from "@src/__mocks__/mockedDb/campaign";
import pageAccess from "@src/__mocks__/mockedDb/pageAccess";
import preselectionForms from "@src/__mocks__/mockedDb/preselectionForm";

describe("GET users/me/campaigns/:campaignId/forms", () => {
  beforeAll(async () => {
    campaign.insert({
      id: 1,
      is_public: 1,
    });
    preselectionForms.insert({
      id: 1,
      campaign_id: 1,
    });
    campaign.insert({
      id: 2,
      page_preview_id: 1,
    });
    preselectionForms.insert({
      id: 2,
      campaign_id: 2,
    });
    pageAccess.insert({
      id: 1,
      view_id: 1,
      tester_id: 1,
    });

    campaign.insert({
      id: 3,
      page_preview_id: 1,
      start_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    });
    preselectionForms.insert({
      id: 3,
      campaign_id: 3,
    });

    campaign.insert({
      id: 4,
      is_public: 1,
    });
  });

  it("Should return 403 if user is not authenticated", async () => {
    const response = await request(app).get("/users/me/campaigns/1/forms");
    expect(response.status).toBe(403);
  });
  it("Should return 404 if campaign does not exists", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/100/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(404);
  });
  it("Should return 200 if campaign has logged user access", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/1/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should return 200 if campaign has selected user access and user is selected", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/2/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should return 404 if campaign is already started", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/3/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(404);
  });
  it("Should return 404 if campaign doesn't have a form linked", async () => {
    const response = await request(app)
      .get("/users/me/campaigns/4/forms")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(404);
  });
});
