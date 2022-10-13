import app from "@src/app";
import Campaigns from "@src/__mocks__/mockedDb/campaign";
import Candidature from "@src/__mocks__/mockedDb/cpHasCandidates";
import Profile from "@src/__mocks__/mockedDb/profile";
import { data as wpUsersData } from "@src/__mocks__/mockedDb/wp_users";
import DeviceOs from "@src/__mocks__/mockedDb/deviceOs";
import DevicePlatform from "@src/__mocks__/mockedDb/devicePlatform";
import TesterDevice from "@src/__mocks__/mockedDb/testerDevice";
import request from "supertest";

beforeEach(async () => {
  await Campaigns.insert();
  await Profile.insert();
  await wpUsersData.basicUser();
});
afterEach(async () => {
  await Campaigns.clear();
  await Profile.clear();
  await wpUsersData.drop();
  await Candidature.clear();
});

const adminPostCandidate = async ({
  tester,
  device,
}: {
  tester: number;
  device?: number | "random";
}) => {
  return await request(app)
    .post("/campaigns/1/candidates")
    .send({ tester_id: tester, device })
    .set("authorization", "Bearer admin");
};

const getCandidature = async ({
  tester,
  campaign,
}: {
  tester: number;
  campaign: number;
}) => {
  const profiles = await Profile.all(["wp_user_id"], [{ id: tester }]);
  if (!profiles.length) return [];
  return await Candidature.all(
    ["accepted", "results", "selected_device"],
    [{ user_id: profiles[0].wp_user_id as number }, { campaign_id: campaign }]
  );
};
describe("POST /campaigns/{campaignId}/candidates", () => {
  it("Should return 403 if user is not admin", async () => {
    const response = await request(app)
      .post("/campaigns/1/candidates")
      .send({ tester_id: 1 })
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should return 200 if user is admin and campaignId exist", async () => {
    const response = await adminPostCandidate({ tester: 1 });
    expect(response.status).toBe(200);
  });
  it("Should return 403 if tester_id does not exist", async () => {
    const response = await adminPostCandidate({ tester: 69 });
    expect(response.status).toBe(403);
  });

  it("Should return 403 if tester is already candidate on campaign", async () => {
    await Candidature.insert({ user_id: 1, campaign_id: 1 });
    const response = await adminPostCandidate({ tester: 1 });
    expect(response.status).toBe(403);
  });

  it("Should candidate the user on success", async () => {
    const beforeCandidature = await getCandidature({ tester: 1, campaign: 1 });
    expect(beforeCandidature.length).toBe(0);
    await adminPostCandidate({ tester: 1 });
    const afterCandidature = await getCandidature({ tester: 1, campaign: 1 });
    expect(afterCandidature).toEqual([
      {
        accepted: 1,
        results: 0,
        selected_device: 0,
      },
    ]);
  });
  it("Should return the candidature on success", async () => {
    const response = await adminPostCandidate({ tester: 1 });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      tester_id: 1,
      campaignId: 1,
      accepted: true,
      status: "ready",
      device: "any",
    });
  });
});

describe("POST /campaigns/{campaignId}/candidates?device=random when user has not devices", () => {
  it("Should candidate the user on success with selected_device=0", async () => {
    const beforeCandidature = await getCandidature({ tester: 1, campaign: 1 });
    expect(beforeCandidature.length).toBe(0);
    await adminPostCandidate({ tester: 1, device: "random" });
    const afterCandidature = await getCandidature({ tester: 1, campaign: 1 });
    expect(afterCandidature).toEqual([
      {
        accepted: 1,
        results: 0,
        selected_device: 0,
      },
    ]);
  });
  it("Should return the candidature on success with device=any", async () => {
    const response = await adminPostCandidate({ tester: 1, device: "random" });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      tester_id: 1,
      campaignId: 1,
      accepted: true,
      status: "ready",
      device: "any",
    });
  });
});

describe("POST /campaigns/{campaignId}/candidates?device=random when user has two devices", () => {
  beforeEach(async () => {
    await DeviceOs.insert({ id: 1, display_name: "Linux" });
    await DevicePlatform.insert({ id: 1, name: "Platform 1" });
    await TesterDevice.insert({
      id: 1,
      id_profile: 1,
      enabled: 1,
      form_factor: "PC",
      pc_type: "Laptop",
      os_version_id: 1,
      platform_id: 1,
    });
    await TesterDevice.insert({
      id: 2,
      id_profile: 1,
      enabled: 1,
      form_factor: "PC",
      pc_type: "Server",
      os_version_id: 1,
      platform_id: 1,
    });
  });
  afterEach(async () => {
    await TesterDevice.clear();
    await DeviceOs.clear();
    await DevicePlatform.clear();
  });
  it("Should candidate the user on success with selected_device one of user devices", async () => {
    const beforeCandidature = await getCandidature({ tester: 1, campaign: 1 });
    expect(beforeCandidature.length).toBe(0);
    await adminPostCandidate({ tester: 1, device: "random" });
    const afterCandidature = await getCandidature({ tester: 1, campaign: 1 });
    expect(afterCandidature).toEqual([
      expect.objectContaining({ accepted: 1, results: 0 }),
    ]);
    expect(afterCandidature[0]).toHaveProperty("selected_device");
    expect([1, 2]).toContainEqual(afterCandidature[0].selected_device);
  });
  it("Should return the candidature with random device from user device", async () => {
    const response = await adminPostCandidate({ tester: 1, device: "random" });
    expect(response.status).toBe(200);
    expect([
      {
        id: 1,
        type: "PC",
        device: { pc_type: "Laptop" },
        operating_system: {
          id: 1,
          platform: "Platform 1",
          version: "Linux (1.0)",
        },
      },
      {
        id: 2,
        type: "PC",
        device: { pc_type: "Server" },
        operating_system: {
          id: 1,
          platform: "Platform 1",
          version: "Linux (1.0)",
        },
      },
    ]).toContainEqual(response.body.device);
  });
});

describe("POST /campaigns/{campaignId}/candidates?device=2 specific user device", () => {
  beforeEach(async () => {
    await DeviceOs.insert({ id: 1, display_name: "Linux" });
    await DevicePlatform.insert({ id: 1, name: "Platform 1" });
    await TesterDevice.insert({
      id: 1,
      id_profile: 1,
      enabled: 1,
      form_factor: "PC",
      pc_type: "Laptop",
      os_version_id: 1,
      platform_id: 1,
    });
    await TesterDevice.insert({
      id: 2,
      id_profile: 1,
      enabled: 1,
      form_factor: "PC",
      pc_type: "Server",
      os_version_id: 1,
      platform_id: 1,
    });
  });
  afterEach(async () => {
    await TesterDevice.clear();
    await DeviceOs.clear();
    await DevicePlatform.clear();
  });
  it("Should candidate the user on success and seleceted_device id as choosen in query param", async () => {
    const beforeCandidature = await getCandidature({ tester: 1, campaign: 1 });
    expect(beforeCandidature.length).toBe(0);

    await adminPostCandidate({ tester: 1, device: 2 });
    const afterCandidature = await getCandidature({ tester: 1, campaign: 1 });

    expect(afterCandidature).toEqual([
      {
        accepted: 1,
        results: 0,
        selected_device: 2,
      },
    ]);
  });
  it("Should return the candidature with device set in query param", async () => {
    const response = await adminPostCandidate({ tester: 1, device: 2 });
    expect(response.status).toBe(200);
    expect(response.body.device).toEqual({
      id: 2,
      type: "PC",
      device: { pc_type: "Server" },
      operating_system: {
        id: 1,
        platform: "Platform 1",
        version: "Linux (1.0)",
      },
    });
  });
  it("Should return 403 with error if try to candidate with an nonexistent device", async () => {
    const response = await adminPostCandidate({ tester: 1, device: 1000 });
    expect(response.status).toBe(403);
  });
});
