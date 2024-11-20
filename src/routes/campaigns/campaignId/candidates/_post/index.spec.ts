import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";
const profile = {
  id: 1,
  wp_user_id: 1,
  email: "tester@example.com",
  employment_id: 1,
  education_id: 1,
};
const wpUser = {
  ID: 1,
  user_login: "tester",
  user_email: "tester@example.com",
  user_pass: "pass",
};
beforeEach(async () => {
  await tryber.tables.WpAppqEvdCampaign.do().insert({
    id: 1,
    title: "Test Campaign",
    customer_title: "Test Campaign",
    start_date: "2020-01-01",
    end_date: "2020-01-01",
    pm_id: 1,
    page_manual_id: 0,
    page_preview_id: 0,
    platform_id: 1,
    customer_id: 1,
    project_id: 1,
  });
  await tryber.tables.WpAppqEvdProfile.do().insert([
    profile,
    { ...profile, id: 2, wp_user_id: 2 },
  ]);
  await tryber.tables.WpCrowdAppqHasCandidate.do().insert({
    user_id: 2,
    campaign_id: 1,
    accepted: 0,
  });
  await tryber.tables.WpUsers.do().insert([wpUser, { ...wpUser, ID: 2 }]);
});
afterEach(async () => {
  await tryber.tables.WpAppqEvdCampaign.do().delete();
  await tryber.tables.WpAppqEvdProfile.do().delete();
  await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
  await tryber.tables.WpUsers.do().delete();
});

const authorizedPostCandidate = async ({
  tester,
  device,
}: {
  tester: number;
  device?: number | "random";
}) => {
  return await request(app)
    .post("/campaigns/1/candidates")
    .send({ tester_id: tester, device })
    .set("authorization", `Bearer tester olp {"appq_tester_selection":[1]}`);
};

const authorizedPostMultiCandidate = async (
  list: {
    tester: number;
    device?: number | "random";
  }[]
) => {
  return await request(app)
    .post("/campaigns/1/candidates")
    .send(list.map((item) => ({ tester_id: item.tester, device: item.device })))
    .set("authorization", `Bearer tester olp {"appq_tester_selection":[1]}`);
};

const getCandidature = async ({
  tester,
  campaign,
}: {
  tester?: number;
  campaign: number;
}) => {
  let candidatures = tryber.tables.WpCrowdAppqHasCandidate.do()
    .select("accepted", "results", "selected_device", "user_id")
    .where("campaign_id", campaign)
    .andWhere("accepted", 1);
  if (tester) {
    const profiles = await tryber.tables.WpAppqEvdProfile.do()
      .select(["wp_user_id"])
      .where({ id: tester });
    candidatures = candidatures.andWhere({ user_id: profiles[0].wp_user_id });
    if (!profiles.length) return [];
  }
  return await candidatures;
};
describe("POST /campaigns/{campaignId}/candidates", () => {
  it("Should return 403 if user has not olp appq_tester_selection on a specific campaign", async () => {
    const response = await request(app)
      .post("/campaigns/1/candidates")
      .send({ tester_id: 1 })
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should return 200 if user is authorized and campaignId exist", async () => {
    const response = await authorizedPostCandidate({ tester: 1 });
    expect(response.status).toBe(200);
  });
  it("Should return 403 if tester_id does not exist", async () => {
    const response = await request(app)
      .post("/campaigns/1000/candidates")
      .send({ tester_id: 1 })
      .set("authorization", `Bearer tester`);
    expect(response.status).toBe(403);
  });
  it("Should return 403 if campaing does not exist", async () => {
    const response = await authorizedPostCandidate({ tester: 69 });
    expect(response.status).toBe(403);
  });

  it("Should return 403 if tester is already candidate on campaign", async () => {
    await tryber.tables.WpCrowdAppqHasCandidate.do().insert({
      user_id: 1,
      campaign_id: 1,
      accepted: 1,
    });
    const response = await authorizedPostCandidate({ tester: 1 });
    expect(response.status).toBe(403);
  });

  it("Should candidate the user on success", async () => {
    const beforeCandidature = await getCandidature({ tester: 1, campaign: 1 });
    expect(beforeCandidature.length).toBe(0);
    await authorizedPostCandidate({ tester: 1 });
    const afterCandidature = await getCandidature({ tester: 1, campaign: 1 });
    expect(afterCandidature).toEqual([
      {
        user_id: 1,
        accepted: 1,
        results: 0,
        selected_device: 0,
      },
    ]);
  });

  it("Should candidate all the users on success", async () => {
    const beforeCandidature = await getCandidature({ campaign: 1 });
    expect(beforeCandidature.length).toBe(0);
    await authorizedPostMultiCandidate([{ tester: 1 }, { tester: 2 }]);
    const afterCandidature = await getCandidature({ campaign: 1 });
    expect(afterCandidature.length).toBe(2);
    expect(afterCandidature).toEqual(
      expect.arrayContaining([
        {
          user_id: 1,
          accepted: 1,
          results: 0,
          selected_device: 0,
        },
        {
          user_id: 2,
          accepted: 1,
          results: 0,
          selected_device: 0,
        },
      ])
    );
  });
  it("Should return the candidature on success", async () => {
    const response = await authorizedPostMultiCandidate([
      { tester: 1 },
      { tester: 2 },
    ]);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toEqual([
      {
        tester_id: 1,
        campaignId: 1,
        device: "any",
      },
      {
        tester_id: 2,
        campaignId: 1,
        device: "any",
      },
    ]);
  });
  it("Should save candidature acceptation-date", async () => {
    const response = await authorizedPostMultiCandidate([
      { tester: 1 },
      { tester: 2 },
    ]);
    expect(response.status).toBe(200);
    const candidatures = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select()
      .where({ campaign_id: 1 });
    expect(candidatures.length).toBe(2);
    expect(candidatures[0].accepted_date).not.toBeNull();
    expect(candidatures[1].accepted_date).not.toBeNull();
  });
});

describe("POST /campaigns/{campaignId}/candidates - user deselected", () => {
  beforeEach(async () => {
    await tryber.tables.WpAppqEvdProfile.do().insert([
      { ...profile, id: 100, wp_user_id: 100 },
    ]);
    await tryber.tables.WpCrowdAppqHasCandidate.do().insert({
      user_id: 100,
      campaign_id: 1,
      accepted: 0,
      results: -1,
    });
  });
  afterEach(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete().where({ id: 100 });
    await tryber.tables.WpCrowdAppqHasCandidate.do()
      .delete()
      .where({ user_id: 100 });
  });

  it("Should select with results=0 if user is deselected", async () => {
    await authorizedPostCandidate({ tester: 100 });
    const candidature = await getCandidature({ tester: 100, campaign: 1 });
    expect(candidature).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: 100,
          results: 0,
        }),
      ])
    );
  });
});

describe("POST /campaigns/{campaignId}/candidates?device=random when user has not devices", () => {
  it("Should candidate the user on success with selected_device=0", async () => {
    const beforeCandidature = await getCandidature({ tester: 1, campaign: 1 });
    expect(beforeCandidature.length).toBe(0);
    await authorizedPostCandidate({ tester: 1, device: "random" });
    const afterCandidature = await getCandidature({ tester: 1, campaign: 1 });
    expect(afterCandidature).toEqual([
      {
        user_id: 1,
        accepted: 1,
        results: 0,
        selected_device: 0,
      },
    ]);
  });
  it("Should return the candidature on success with device=any", async () => {
    const response = await authorizedPostCandidate({
      tester: 1,
      device: "random",
    });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toEqual([
      {
        tester_id: 1,
        campaignId: 1,
        device: "any",
      },
    ]);
  });

  it("Should return the multi candidature on success with device=any", async () => {
    const response = await authorizedPostCandidate({
      tester: 1,
      device: "random",
    });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toEqual([
      {
        tester_id: 1,
        campaignId: 1,
        device: "any",
      },
    ]);
  });
});

describe("POST /campaigns/{campaignId}/candidates?device=random when user has two devices", () => {
  beforeEach(async () => {
    await tryber.tables.WpAppqOs.do().insert({
      id: 1,
      display_name: "Linux",
      platform_id: 1,
      main_release: 1,
      version_family: 1,
      version_number: "1.0",
    });
    await tryber.tables.WpAppqEvdPlatform.do().insert({
      id: 1,
      name: "Platform 1",
      architecture: 86,
    });
    await tryber.tables.WpCrowdAppqDevice.do().insert([
      {
        id: 1,
        id_profile: 1,
        enabled: 1,
        form_factor: "PC",
        pc_type: "Laptop",
        os_version_id: 1,
        platform_id: 1,
      },
      {
        id: 2,
        id_profile: 1,
        enabled: 1,
        form_factor: "PC",
        pc_type: "Server",
        os_version_id: 1,
        platform_id: 1,
      },
    ]);
  });
  afterEach(async () => {
    await tryber.tables.WpCrowdAppqDevice.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
    await tryber.tables.WpAppqOs.do().delete();
  });
  it("Should candidate the user on success with selected_device one of user devices", async () => {
    const beforeCandidature = await getCandidature({ tester: 1, campaign: 1 });
    expect(beforeCandidature.length).toBe(0);
    await authorizedPostCandidate({ tester: 1, device: "random" });
    const afterCandidature = await getCandidature({ tester: 1, campaign: 1 });
    expect(afterCandidature).toEqual([
      expect.objectContaining({ accepted: 1, results: 0 }),
    ]);
    expect(afterCandidature[0]).toHaveProperty("selected_device");
    expect([1, 2]).toContainEqual(afterCandidature[0].selected_device);
  });
  it("Should return the candidature with random device from user device", async () => {
    const response = await authorizedPostCandidate({
      tester: 1,
      device: "random",
    });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results.length).toBe(1);
    expect([1, 2]).toContainEqual(response.body.results[0].device);
  });
});

describe("POST /campaigns/{campaignId}/candidates?device=2 specific user device", () => {
  beforeEach(async () => {
    await tryber.tables.WpAppqOs.do().insert({
      id: 1,
      display_name: "Linux",
      platform_id: 1,
      main_release: 1,
      version_family: 1,
      version_number: "1.0",
    });
    await tryber.tables.WpAppqEvdPlatform.do().insert({
      id: 1,
      name: "Platform 1",
      architecture: 86,
    });
    await tryber.tables.WpCrowdAppqDevice.do().insert([
      {
        id: 1,
        id_profile: 1,
        enabled: 1,
        form_factor: "PC",
        pc_type: "Laptop",
        os_version_id: 1,
        platform_id: 1,
      },
      {
        id: 2,
        id_profile: 1,
        enabled: 1,
        form_factor: "PC",
        pc_type: "Server",
        os_version_id: 1,
        platform_id: 1,
      },
      {
        id: 3,
        id_profile: 1,
        enabled: 1,
        form_factor: "PC",
        pc_type: "Server",
        os_version_id: 1,
        platform_id: 1,
      },
    ]);
  });
  afterEach(async () => {
    await tryber.tables.WpCrowdAppqDevice.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
    await tryber.tables.WpAppqOs.do().delete();
  });
  it("Should candidate the user on success and seleceted_device id as choosen in query param", async () => {
    const beforeCandidature = await getCandidature({ tester: 1, campaign: 1 });
    expect(beforeCandidature.length).toBe(0);

    await authorizedPostCandidate({ tester: 1, device: 2 });
    const afterCandidature = await getCandidature({ tester: 1, campaign: 1 });

    expect(afterCandidature).toEqual([
      {
        user_id: 1,
        accepted: 1,
        results: 0,
        selected_device: 2,
      },
    ]);
  });
  it("Should return the candidature with device set in query param", async () => {
    const response = await authorizedPostCandidate({ tester: 1, device: 2 });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results.length).toEqual(1);
    expect(response.body.results[0].device).toEqual(2);
  });
  it("Should return 403 with error if try to candidate with an nonexistent device", async () => {
    const response = await authorizedPostCandidate({ tester: 1, device: 1000 });
    expect(response.status).toBe(403);
  });

  it("Should return 207 with list of invalid testers if there's a partial success for non existing tester", async () => {
    const response = await authorizedPostMultiCandidate([
      { tester: 1 },
      { tester: 1000 },
    ]);
    expect(response.status).toBe(207);
    expect(response.body).toHaveProperty("results");
    expect(response.body).toHaveProperty("invalidTesters");
    expect(response.body.results.length).toEqual(1);
    expect(response.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester_id: 1,
        }),
      ])
    );
    expect(response.body.invalidTesters).toEqual([1000]);
  });

  it("Should return 207 with list of invalid testers if there's a partial success for non existing device", async () => {
    const response = await authorizedPostMultiCandidate([
      { tester: 1, device: 1 },
      { tester: 2, device: 1000 },
    ]);
    expect(response.status).toBe(207);
    expect(response.body).toHaveProperty("results");
    expect(response.body).toHaveProperty("invalidTesters");
    expect(response.body.results.length).toEqual(1);
    expect(response.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tester_id: 1,
        }),
      ])
    );
    expect(response.body.invalidTesters).toEqual([2]);
  });
});
