import campaign from "@src/__mocks__/mockedDb/campaign";
import campaignApplications from "@src/__mocks__/mockedDb/cpHasCandidates";
import customUserFields from "@src/__mocks__/mockedDb/customUserFields";
import customUserFieldsExtra from "@src/__mocks__/mockedDb/customUserFieldsExtra";
import Experience from "@src/__mocks__/mockedDb/experience";
import pageAccess from "@src/__mocks__/mockedDb/pageAccess";
import preselectionForm from "@src/__mocks__/mockedDb/preselectionForm";
import preselectionFormData from "@src/__mocks__/mockedDb/preselectionFormData";
import preselectionFormFields from "@src/__mocks__/mockedDb/preselectionFormFields";
import profile from "@src/__mocks__/mockedDb/profile";
import testerDevice from "@src/__mocks__/mockedDb/testerDevice";
import app from "@src/app";
import request from "supertest";

describe("POST users/me/campaigns/:campaignId/forms", () => {
  beforeEach(() => {
    profile.insert({ id: 1, wp_user_id: 1 });
    campaign.insert({
      id: 1,
      start_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      is_public: 1,
      os: "1,2",
    });
    campaign.insert({
      id: 2,
      start_date: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    });
    campaign.insert({
      id: 3,
      start_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      is_public: 3,
    });
    campaign.insert({
      id: 4,
      start_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      is_public: 3,
      page_preview_id: 1,
    });
    pageAccess.insert({
      view_id: 1,
      tester_id: 1,
    });
    preselectionForm.insert({
      id: 1,
      campaign_id: 1,
    });
    testerDevice.insert({
      id: 1,
      id_profile: 1,
      enabled: 1,
      platform_id: 1,
    });
    testerDevice.insert({
      id: 2,
      id_profile: 1,
      enabled: 1,
      platform_id: 4,
    });
    testerDevice.insert({
      id: 3,
      id_profile: 1,
      enabled: 1,
      platform_id: 1,
    });
  });

  afterEach(() => {
    profile.clear();
    campaign.clear();
    pageAccess.clear();
    testerDevice.clear();
    preselectionFormData.clear();
    preselectionFormFields.clear();
    preselectionForm.clear();
    customUserFields.clear();
    customUserFieldsExtra.clear();
    campaignApplications.clear();
    Experience.clear();
  });
  it("Should return 403 if user is not authenticated", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({ device: [1] });
    expect(response.status).toBe(403);
  });
  it("Should return 404 if campaign does not exists", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/100/forms")
      .send({ device: [1] })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(404);
  });
  it("Should return 403 if application to the campaign is not available", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/2/forms")
      .send({ device: [1] })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should return 403 if tester cannot apply", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/3/forms")
      .send({ device: [1] })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should return 403 if tester already applied", async () => {
    await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({ device: [1] })
      .set("Authorization", "Bearer tester");
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({ device: [1] })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should return 200 if campaign is public", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({ device: [1] })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should return 200 if campaign is small group and tester has access", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/4/forms")
      .send({ device: [1] })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should return 406 device is not sent", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({})
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(406);
  });
  it("Should return 403 device is not compatible with campaign", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({ device: [2] })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should candidate user if everything is alright", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({ device: [1, 3] })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const applications = await campaignApplications.all();
    expect(applications.length).toBe(1);
    expect(applications[0].campaign_id).toBe(1);
    expect(applications[0].user_id).toBe(1);
    expect(applications[0].devices).toBe("1,3");
    expect(applications[0].accepted).toBe(0);
  });
  it("Should add 5 exp points to user on candidature", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({ device: [1, 3] })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
    const expAttribution = await Experience.all(undefined, [
      { tester_id: 1 },
      { campaign_id: 1 },
    ]);
    expect(expAttribution.length).toBe(1);
    expect(expAttribution).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester_id: 1,
          campaign_id: 1,
          amount: 5,
          activity_id: 4,
          reason: "Subscription to Test Campaign",
        }),
      ])
    );
  });
});
