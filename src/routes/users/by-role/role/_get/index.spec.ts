import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("Route GET /users/by-role/quality_leader", () => {
  beforeAll(async () => {
    const profile = {
      surname: "User",
      email: "",
      education_id: 1,
      employment_id: 1,
    };
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        ...profile,
        id: 1,
        wp_user_id: 10,
        name: "CSM",
      },
      {
        ...profile,
        id: 2,
        wp_user_id: 20,
        name: "Testissimo",
      },
      {
        ...profile,
        id: 3,
        wp_user_id: 30,
        name: "Contributor",
      },
      {
        ...profile,
        id: 4,
        wp_user_id: 40,
        name: "Tester Leader",
      },
      {
        ...profile,
        id: 5,
        wp_user_id: 50,
        name: "UX Researcher",
      },
    ]);

    await tryber.tables.WpUsers.do().insert([
      { ID: 10 },
      { ID: 20 },
      { ID: 30 },
      { ID: 40 },
      { ID: 50 },
    ]);

    await tryber.tables.WpUsermeta.do().insert([
      {
        user_id: 10,
        meta_key: "wp_capabilities",
        meta_value: 'a:1:{s:14:"quality_leader";b:1;}',
      },
      {
        user_id: 20,
        meta_key: "wp_capabilities",
        meta_value: 'a:1:{s:20:"quality_leaderissimo";b:1;}',
      },
      {
        user_id: 30,
        meta_key: "wp_capabilities",
        meta_value: 'a:1:{s:11:"contributor";b:1;}',
      },
      {
        user_id: 40,
        meta_key: "wp_capabilities",
        meta_value: 'a:1:{s:11:"tester_lead";b:1;}',
      },
      {
        user_id: 50,
        meta_key: "wp_capabilities",
        meta_value: 'a:1:{s:13:"ux_researcher";b:1;}',
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpUsers.do().delete();
  });
  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/users/by-role/quality_leader");

    expect(response.status).toBe(403);
  });

  it("Should answer 200 if logged ad admin", async () => {
    const response = await request(app)
      .get("/users/by-role/quality_leader")
      .set("authorization", "Bearer admin");

    expect(response.status).toBe(200);
  });

  it("Should answer 403 if logged in as tester", async () => {
    const response = await request(app)
      .get("/users/by-role/quality_leader")
      .set("authorization", "Bearer tester");

    expect(response.status).toBe(403);
  });

  it("Should answer 200 if logged with full access to campaign", async () => {
    const response = await request(app)
      .get("/users/by-role/quality_leader")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');

    expect(response.status).toBe(200);
  });
  it("Should answer 403 if logged with access to a single campaign", async () => {
    const response = await request(app)
      .get("/users/by-role/quality_leader")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');

    expect(response.status).toBe(403);
  });

  it("Should answer with list of quality leaders", async () => {
    const response = await request(app)
      .get("/users/by-role/quality_leader")
      .set("authorization", "Bearer admin");

    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toEqual([
      {
        id: 1,
        name: "CSM",
        surname: "User",
      },
    ]);
  });
  it("Should answer with list of tester leader", async () => {
    const response = await request(app)
      .get("/users/by-role/tester_lead")
      .set("authorization", "Bearer admin");

    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toEqual([
      {
        id: 4,
        name: "Tester Leader",
        surname: "User",
      },
    ]);
  });

  it("Should answer with list of ux researcher", async () => {
    const response = await request(app)
      .get("/users/by-role/ux_researcher")
      .set("authorization", "Bearer admin");

    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toEqual([
      {
        id: 5,
        name: "UX Researcher",
        surname: "User",
      },
    ]);
  });
  it("Should answer 400 when asking for contributor", async () => {
    const response = await request(app)
      .get("/users/by-role/contributor")
      .set("authorization", "Bearer admin");

    expect(response.status).toBe(400);
  });
});
