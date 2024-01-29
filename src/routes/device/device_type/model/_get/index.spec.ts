import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("GET /devices/{type}/models", () => {
  it("Should answer 403 if user is not logged in", async () => {
    const response = await request(app).get("/devices/1/models");
    expect(response.status).toBe(403);
  });

  describe("No data", () => {
    it("Should answer 404", async () => {
      const response = await request(app)
        .get("/devices/1/models")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(404);
    });
  });

  describe("With data", () => {
    beforeAll(async () => {
      await tryber.tables.WpDcAppqDevices.do().insert([
        {
          id: 1,
          device_type: 1,
          manufacturer: "Apple",
          model: "iPhone 12",
        },
        {
          id: 2,
          device_type: 1,
          manufacturer: "Apple",
          model: "iPhone 13",
        },
        {
          id: 3,
          device_type: 1,
          manufacturer: "Android",
          model: "Galaxy S21",
        },
        {
          id: 4,
          device_type: 1,
          manufacturer: "Fakeple",
          model: "iPhone 12",
        },
      ]);
    });
    afterAll(async () => {
      await tryber.tables.WpDcAppqDevices.do().delete();
    });

    it("Should answer 200", async () => {
      const response = await request(app)
        .get("/devices/1/models")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(200);
    });
    it("Should answer 404 if device type does not exists", async () => {
      const response = await request(app)
        .get("/devices/5/models")
        .set("Authorization", "Bearer tester");
      expect(response.status).toBe(404);
    });

    it("Should answer with a list of devices", async () => {
      const response = await request(app)
        .get("/devices/1/models")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveLength(3);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            manufacturer: "Android",
            models: [
              expect.objectContaining({
                id: 3,
              }),
            ],
          }),
          expect.objectContaining({
            manufacturer: "Fakeple",
            models: [
              expect.objectContaining({
                id: 4,
              }),
            ],
          }),
          expect.objectContaining({
            manufacturer: "Apple",
            models: [
              expect.objectContaining({
                id: 1,
                name: "iPhone 12",
              }),
              expect.objectContaining({
                id: 2,
                name: "iPhone 13",
              }),
            ],
          }),
        ])
      );
    });

    it("Should allow filtering by manufacturer", async () => {
      const response = await request(app)
        .get("/devices/1/models?filterBy[manufacturer]=Apple")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveLength(1);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            manufacturer: "Apple",
            models: [
              expect.objectContaining({
                id: 1,
                name: "iPhone 12",
              }),
              expect.objectContaining({
                id: 2,
                name: "iPhone 13",
              }),
            ],
          }),
        ])
      );
    });

    it("Should allow filtering by model", async () => {
      const response = await request(app)
        .get("/devices/1/models?filterBy[model]=iPhone 12")
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveLength(2);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            manufacturer: "Apple",
            models: [
              expect.objectContaining({
                id: 1,
                name: "iPhone 12",
              }),
            ],
          }),
          expect.objectContaining({
            manufacturer: "Fakeple",
            models: [
              expect.objectContaining({
                id: 4,
                name: "iPhone 12",
              }),
            ],
          }),
        ])
      );
    });

    it("Should allow filtering by manufacturer and model", async () => {
      const response = await request(app)
        .get(
          "/devices/1/models?filterBy[model]=iPhone 12&filterBy[manufacturer]=Apple"
        )
        .set("Authorization", "Bearer tester");
      expect(response.body).toHaveLength(1);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            manufacturer: "Apple",
            models: [
              expect.objectContaining({
                id: 1,
                name: "iPhone 12",
              }),
            ],
          }),
        ])
      );
    });
  });
});
