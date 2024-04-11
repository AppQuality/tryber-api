import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("GET /devices/{type}/operating_systems - form factor", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdPlatform.do().insert([
      {
        id: 1,
        name: "Android",
        form_factor: 0,
        architecture: 0,
      },
      {
        id: 2,
        name: "Android",
        form_factor: 1,
        architecture: 0,
      },
      {
        id: 3,
        name: "Windows",
        form_factor: 2,
        architecture: 0,
      },
      {
        id: 4,
        name: "WearOS",
        form_factor: 3,
        architecture: 0,
      },
      {
        id: 5,
        name: "PlayStation",
        form_factor: 4,
        architecture: 0,
      },
      {
        id: 6,
        name: "TvOS",
        form_factor: 5,
        architecture: 0,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdPlatform.do().delete();
  });

  it("Should return device type ", async () => {
    const response = await request(app)
      .get("/devices/0/operating_systems")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          type: "Smartphone",
        }),
      ])
    );
  });

  it("Should return device type for all types", async () => {
    const response = await request(app)
      .get("/devices/all/operating_systems")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          type: "Smartphone",
        }),
        expect.objectContaining({
          id: 2,
          type: "Tablet",
        }),
        expect.objectContaining({
          id: 3,
          type: "PC",
        }),
        expect.objectContaining({
          id: 4,
          type: "Smartwatch",
        }),
        expect.objectContaining({
          id: 5,
          type: "Console",
        }),
        expect.objectContaining({
          id: 6,
          type: "SmartTV",
        }),
      ])
    );
  });
});
