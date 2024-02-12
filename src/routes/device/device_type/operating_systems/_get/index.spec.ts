import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("GET /devices/{type}/operating_systems", () => {
  it("Should answer 403 if user is not logged in", async () => {
    const response = await request(app).get("/devices/1/operating_systems");
    expect(response.status).toBe(403);
  });

  describe("No data", () => {
    it("Should answer 404", async () => {
      const response = await request(app)
        .get("/devices/1/operating_systems")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(404);
    });
  });

  describe("With data", () => {
    beforeAll(async () => {
      await tryber.tables.WpAppqEvdPlatform.do().insert([
        {
          id: 1,
          name: "iOS",
          form_factor: 1,
          architecture: 1,
        },
        {
          id: 2,
          name: "Android",
          form_factor: 1,
          architecture: 1,
        },
        {
          id: 3,
          name: "fakeOS",
          form_factor: 1,
          architecture: 1,
        },
      ]);

      await tryber.tables.WpDcAppqDevices.do().insert([
        {
          id: 1,
          device_type: 1,
          manufacturer: "Apple",
          model: "iPhone 12",
          platform_id: 1,
        },
        {
          id: 2,
          device_type: 1,
          manufacturer: "Apple",
          model: "iPhone 13",
          platform_id: 1,
        },
        {
          id: 3,
          device_type: 1,
          manufacturer: "Android",
          model: "Galaxy S21",
          platform_id: 2,
        },
        {
          id: 4,
          device_type: 1,
          manufacturer: "Fakeple",
          model: "iPhone 12",
          platform_id: 3,
        },
        {
          id: 5,
          device_type: 1,
          manufacturer: "Apple",
          model: "iPhone 15",
          platform_id: 1,
        },
      ]);
    });
    afterAll(async () => {
      await tryber.tables.WpDcAppqDevices.do().delete();
    });

    it("Should answer 200", async () => {
      const response = await request(app)
        .get("/devices/1/operating_systems")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
    });

    it("Should answer with a list of os", async () => {
      const response = await request(app)
        .get("/devices/1/operating_systems")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveLength(3);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            name: "iOS",
          }),
          expect.objectContaining({
            id: 2,
            name: "Android",
          }),
          expect.objectContaining({
            id: 3,
            name: "fakeOS",
          }),
        ])
      );
    });

    it("Should allow filtering by model", async () => {
      const response = await request(app)
        .get("/devices/1/operating_systems?filterBy[model]=iPhone 12")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveLength(2);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            name: "iOS",
          }),
          expect.objectContaining({
            id: 3,
            name: "fakeOS",
          }),
        ])
      );
    });

    it("Should allow filtering by manufacturer", async () => {
      const response = await request(app)
        .get("/devices/1/operating_systems?filterBy[manufacturer]=Apple")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveLength(1);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            name: "iOS",
          }),
        ])
      );
    });

    it("Should allow filtering by manufacturer and model", async () => {
      const response = await request(app)
        .get(
          "/devices/1/operating_systems?filterBy[manufacturer]=Apple&filterBy[model]=iPhone 15"
        )
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveLength(1);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            name: "iOS",
          }),
        ])
      );
    });
  });
});
