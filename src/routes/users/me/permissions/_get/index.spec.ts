import request from "supertest";
import app from "@src/app";

describe("GET /users/me/permissions", () => {
  it("Should return all permission if user is admin", async () => {
    const response = await request(app)
      .get("/users/me/permissions")
      .set("Authorization", "Bearer admin");
    expect(response.body).toEqual({
      appq_bug: true,
      appq_campaign: true,
      appq_message_center: true,
      appq_prospect: true,
      appq_tester_selection: true,
    });
  });
  it("Should return permission of bug management for specific campaigns", async () => {
    const response = await request(app)
      .get("/users/me/permissions")
      .set("Authorization", 'Bearer tester olp {"appq_bug":[1,2]}');
    expect(response.body).toEqual({ appq_bug: [1, 2] });
  });
  it("Should return permission of bug management for all campaigns", async () => {
    const response = await request(app)
      .get("/users/me/permissions")
      .set("Authorization", 'Bearer tester olp {"appq_bug":true}');
    expect(response.body).toEqual({ appq_bug: true });
  });
  it("Should return permission of campaign management for specific campaigns", async () => {
    const response = await request(app)
      .get("/users/me/permissions")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,2]}');
    expect(response.body).toEqual({ appq_campaign: [1, 2] });
  });
  it("Should return permission of campaign management for all campaigns", async () => {
    const response = await request(app)
      .get("/users/me/permissions")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body).toEqual({ appq_campaign: true });
  });
  it("Should return permission of message center management for specific campaigns", async () => {
    const response = await request(app)
      .get("/users/me/permissions")
      .set("Authorization", 'Bearer tester olp {"appq_message_center":[1,2]}');
    expect(response.body).toEqual({ appq_message_center: [1, 2] });
  });
  it("Should return permission of message center management for all campaigns", async () => {
    const response = await request(app)
      .get("/users/me/permissions")
      .set("Authorization", 'Bearer tester olp {"appq_message_center":true}');
    expect(response.body).toEqual({ appq_message_center: true });
  });
  it("Should return permission of prospect management for specific campaigns", async () => {
    const response = await request(app)
      .get("/users/me/permissions")
      .set("Authorization", 'Bearer tester olp {"appq_prospect":[1,2]}');
    expect(response.body).toEqual({ appq_prospect: [1, 2] });
  });
  it("Should return permission of prospect management for all campaigns", async () => {
    const response = await request(app)
      .get("/users/me/permissions")
      .set("Authorization", 'Bearer tester olp {"appq_prospect":true}');
    expect(response.body).toEqual({ appq_prospect: true });
  });
  it("Should return permission of tester_selection management for specific campaigns", async () => {
    const response = await request(app)
      .get("/users/me/permissions")
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1,2]}'
      );
    expect(response.body).toEqual({ appq_tester_selection: [1, 2] });
  });
  it("Should return permission of tester_selection management for all campaigns", async () => {
    const response = await request(app)
      .get("/users/me/permissions")
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":true}');
    expect(response.body).toEqual({ appq_tester_selection: true });
  });

  it("Should return permissions of prospect and tester selection if the user has it", async () => {
    const response = await request(app)
      .get("/users/me/permissions")
      .set(
        "Authorization",
        'Bearer tester olp {"appq_tester_selection":[1,7],"appq_prospect":true}'
      );
    expect(response.body).toEqual({
      appq_tester_selection: [1, 7],
      appq_prospect: true,
    });
  });

  it("Should return empty object if user is not admin and has no permissions", async () => {
    const response = await request(app)
      .get("/users/me/permissions")
      .set("Authorization", "Bearer tester");
    expect(response.body).toEqual({});
  });
});
