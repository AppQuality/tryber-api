import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("GET /devices/{type}/operating_systems", () => {
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
        name: "Android (Tablet)",
        form_factor: 1,
        architecture: 0,
      },
      {
        id: 3,
        name: "iOS",
        form_factor: 0,
        architecture: 0,
      },
      {
        id: 4,
        name: "Android (Farlocco)",
        form_factor: 0,
        architecture: 0,
      },
    ]);

    await tryber.tables.WpDcAppqDevices.do().insert([
      {
        id: 1,
        device_type: 0,
        manufacturer: "Samsung",
        model: "Galaxy S10",
        platform_id: 1,
      },
      {
        id: 2,
        device_type: 0,
        manufacturer: "Apple",
        model: "iPhone 11",
        platform_id: 3,
      },
      {
        id: 3,
        device_type: 1,
        manufacturer: "Samsung",
        model: "Galaxy Tab S6",
        platform_id: 2,
      },
      {
        id: 4,
        device_type: 0,
        manufacturer: "Samsung",
        model: "Galaxy S10 Farlocco",
        platform_id: 4,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdPlatform.do().delete();
  });
  it("Should return 403 if user is not logged in", async () => {
    const response = await request(app).get("/devices/0/operating_systems");
    expect(response.status).toBe(403);
  });

  it("Should return 200 if user is logged in", async () => {
    const response = await request(app)
      .get("/devices/0/operating_systems")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });

  it("Should return the os by form factor", async () => {
    const responseFF0 = await request(app)
      .get("/devices/0/operating_systems")
      .set("authorization", "Bearer tester");
    expect(responseFF0.body).toHaveLength(3);
    expect(responseFF0.body[0]).toHaveProperty("id", 1);
    expect(responseFF0.body[0]).toHaveProperty("name", "Android");
    expect(responseFF0.body[1]).toHaveProperty("id", 3);
    expect(responseFF0.body[1]).toHaveProperty("name", "iOS");
    expect(responseFF0.body[2]).toHaveProperty("id", 4);
    expect(responseFF0.body[2]).toHaveProperty("name", "Android (Farlocco)");
    const responseFF1 = await request(app)
      .get("/devices/1/operating_systems")
      .set("authorization", "Bearer tester");
    expect(responseFF1.body).toHaveLength(1);
    expect(responseFF1.body[0]).toHaveProperty("id", 2);
    expect(responseFF1.body[0]).toHaveProperty("name", "Android (Tablet)");
  });

  it("Should return the os by manufacturer", async () => {
    const response = await request(app)
      .get("/devices/0/operating_systems?filterBy[manufacturer]=Samsung")
      .set("authorization", "Bearer tester");

    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toHaveProperty("id", 1);
    expect(response.body[0]).toHaveProperty("name", "Android");
    expect(response.body[1]).toHaveProperty("id", 4);
    expect(response.body[1]).toHaveProperty("name", "Android (Farlocco)");
  });
  it("Should return the os by model", async () => {
    const response = await request(app)
      .get("/devices/0/operating_systems?filterBy[model]=Galaxy S10")
      .set("authorization", "Bearer tester");

    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty("id", 1);
    expect(response.body[0]).toHaveProperty("name", "Android");
  });

  it("Should return the os by model and manufacturer", async () => {
    const response = await request(app)
      .get(
        "/devices/0/operating_systems?filterBy[model]=Galaxy S10&filterBy[manufacturer]=Samsung"
      )
      .set("authorization", "Bearer tester");

    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty("id", 1);
    expect(response.body[0]).toHaveProperty("name", "Android");
  });
});
