import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("Route GET /users/projectManagers", () => {
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
        name: "Test",
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
    ]);

    await tryber.tables.WpUsers.do().insert([
      { ID: 10 },
      { ID: 20 },
      { ID: 30 },
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
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpUsers.do().delete();
  });
  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/users/projectManagers");

    expect(response.status).toBe(403);
  });

  it("Should answer 200 if logged ad admin", async () => {
    const response = await request(app)
      .get("/users/projectManagers")
      .set("authorization", "Bearer admin");

    expect(response.status).toBe(200);
  });

  it("Should answer 403 if logged in as tester", async () => {
    const response = await request(app)
      .get("/users/projectManagers")
      .set("authorization", "Bearer tester");

    expect(response.status).toBe(403);
  });

  it("Should answer 200 if logged with full access to campaign", async () => {
    const response = await request(app)
      .get("/users/projectManagers")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');

    expect(response.status).toBe(200);
  });
  it("Should answer 403 if logged with access to a single campaign", async () => {
    const response = await request(app)
      .get("/users/projectManagers")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');

    expect(response.status).toBe(403);
  });

  it("Should answer with list of quality leaders", async () => {
    const response = await request(app)
      .get("/users/projectManagers")
      .set("authorization", "Bearer admin");

    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toEqual([
      {
        id: 1,
        name: "Test",
        surname: "User",
      },
    ]);
  });
});
