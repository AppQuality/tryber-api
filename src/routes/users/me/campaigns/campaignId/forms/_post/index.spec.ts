import app from "@src/app";
import request from "supertest";
import campaign from "@src/__mocks__/mockedDb/campaign";
import pageAccess from "@src/__mocks__/mockedDb/pageAccess";
import testerDevice from "@src/__mocks__/mockedDb/testerDevice";

describe("POST users/me/campaigns/:campaignId/forms", () => {
  beforeAll(() => {
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

    testerDevice.insert({
      id: 1,
      id_profile: 1,
      enabled: 1,
      platform_id: 4,
    });
  });

  afterAll(() => {});
  it("Should return 403 if user is not authenticated", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({ device: 1 });
    expect(response.status).toBe(403);
  });
  it("Should return 404 if campaign does not exists", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/100/forms")
      .send({ device: 1 })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(404);
  });
  it("Should return 403 if application to the campaign is not available", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/2/forms")
      .send({ device: 1 })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should return 403 if tester cannot apply", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/3/forms")
      .send({ device: 1 })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should return 200 if campaign is public", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/1/forms")
      .send({ device: 1 })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should return 200 if campaign is small group and tester has access", async () => {
    const response = await request(app)
      .post("/users/me/campaigns/4/forms")
      .send({ device: 1 })
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
  //   it("Should return 403 device is not compatible with campaign", async () => {
  //     const response = await request(app)
  //       .post("/users/me/campaigns/1/forms")
  //       .send({ device: 4 })
  //       .set("Authorization", "Bearer tester");
  //     expect(response.status).toBe(403);
  //   });
});
