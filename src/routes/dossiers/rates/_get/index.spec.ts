import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("Route GET /dossiers/rates", () => {
  beforeAll(async () => {
    await tryber.tables.WorkRates.do().insert([
      {
        id: 1,
        name: "Junior Tester",
        daily_rate: 100,
      },
      {
        id: 2,
        name: "Senior Tester",
        daily_rate: 200,
      },
    ]);
    await tryber.tables.WpAppqEvdProfile.do().insert({
      id: 1,
      wp_user_id: 1,
      email: "pino@example.com",
      employment_id: 1,
      education_id: 1,
    });
  });

  afterAll(async () => {
    await tryber.tables.WorkRates.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/dossiers/rates");

    expect(response.status).toBe(403);
  });

  it("Should answer 401 if not admin", async () => {
    const response = await request(app)
      .get("/dossiers/rates")
      .set("authorization", "Bearer tester");

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({ message: "No access to campaign" })
    );
  });

  it("Should answer 200 if user is admin", async () => {
    const response = await request(app)
      .get(`/dossiers/rates`)
      .set("authorization", "Bearer admin");

    expect(response.status).toBe(200);
  });

  it("Should return 200 if user has only some campaign olps", async () => {
    const response = await request(app)
      .get(`/dossiers/rates`)
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,2,3]}');

    expect(response.status).toBe(200);
  });

  it("Should return 200 if user has full campaign olps", async () => {
    const response = await request(app)
      .get(`/dossiers/rates`)
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');

    expect(response.status).toBe(200);
  });
  it("Should return array of items", async () => {
    const response = await request(app)
      .get(`/dossiers/rates`)
      .set("authorization", "Bearer admin");

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("items");
    expect(response.body.items).toBeInstanceOf(Array);
    expect(response.body.items.length).toBe(2);
  });

  it("Should return items with id, name and rate", async () => {
    const response = await request(app)
      .get(`/dossiers/rates`)
      .set("authorization", "Bearer admin");

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty(
      "items",
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          name: "Junior Tester",
          rate: 100,
        }),
        expect.objectContaining({
          id: 2,
          name: "Senior Tester",
          rate: 200,
        }),
      ])
    );
  });
});
