import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import { data as deviceOsData } from "@src/__mocks__/mockedDb/deviceOs";
import { data as devicePlatformData } from "@src/__mocks__/mockedDb/devicePlatform";
import { data as profileData } from "@src/__mocks__/mockedDb/profile";
import { data as deviceData } from "@src/__mocks__/mockedDb/testerDevice";
import request from "supertest";

const tester1 = {
  id: 1,
  wp_user_id: 1,
};
const device1 = {
  id: 1,
  form_factor: "Smartphone",
  model: "Galassy note 3",
  //pc_type: null,
  manufacturer: "Samsungu",
  os_version_id: 11,
  id_profile: 1,
  enabled: 1,
  source_id: 1,
  platform_id: 10,
};
const deviceDisabled = {
  id: 1,
  form_factor: "Smartphone",
  model: "Galassy note 3",
  //pc_type: null,
  manufacturer: "Samsungu",
  os_version_id: 11,
  id_profile: 1,
  enabled: 0,
  source_id: 1,
  platform_id: 10,
};
const platform1 = {
  id: 10,
  name: "Androis",
};
const os1 = {
  id: 11,
  display_name: "Lollipoop",
  version_number: "1.0.0",
};

describe("Route GET users-me-devices", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.insert("wp_appq_evd_profile", tester1);
      await sqlite3.insert("wp_crowd_appq_device", device1);
      await sqlite3.insert("wp_appq_evd_platform", platform1);
      await sqlite3.insert("wp_appq_os", os1);
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await profileData.drop();
      await deviceData.drop();
      await devicePlatformData.drop();
      await deviceOsData.drop();
      resolve(null);
    });
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/users/me/devices");
    expect(response.status).toBe(403);
  });

  it("Should answer 200 if logged in tryber", async () => {
    const response = await request(app)
      .get("/users/me/devices")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should answer with all tryber devices", async () => {
    const response = await request(app)
      .get("/users/me/devices")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    const expectDevice = {
      id: device1.id,
      type: device1.form_factor,
      operating_system: {
        id: os1.id,
        platform: platform1.name,
        version: os1.display_name + " (" + os1.version_number + ")",
      },
      device: {
        id: device1.id,
        manufacturer: device1.manufacturer,
        model: device1.model,
      },
    };
    expect(response.body[0]).toMatchObject(expectDevice);
  });
});

describe("Route GET users-me-devices when the user hasn't devices", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.insert("wp_appq_evd_profile", tester1);
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await profileData.drop();
      resolve(null);
    });
  });

  it("Should answer 404 if the user hasn't any devices", async () => {
    const response = await request(app)
      .get("/users/me/devices")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      element: "devices",
      id: 1,
      message: "No device on your user",
    });
  });
});

describe("Route GET users-me-devices when the user devices are all disabled", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await sqlite3.insert("wp_appq_evd_profile", tester1);
      await sqlite3.insert("wp_crowd_appq_device", deviceDisabled);
      await sqlite3.insert("wp_appq_evd_platform", platform1);
      await sqlite3.insert("wp_appq_os", os1);
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await profileData.drop();
      await deviceData.drop();
      await devicePlatformData.drop();
      await deviceOsData.drop();
      resolve(null);
    });
  });
  it("Should answer 404 if the user devices are all disabled", async () => {
    const response = await request(app)
      .get("/users/me/devices")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      element: "devices",
      id: 1,
      message: "No device on your user",
    });
  });
});
