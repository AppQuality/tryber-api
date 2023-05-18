import app from "@src/app";
import request from "supertest";
import { tryber } from "@src/features/database";

const tester1 = {
  id: 1,
  wp_user_id: 1,
  email: "jhon.doe@unguess.io",
  education_id: 1,
  employment_id: 1,
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
  architecture: 1,
  form_factor: 1,
};
const os1 = {
  id: 11,
  display_name: "Lollipoop",
  version_number: "1.0.0",
  platform_id: 10,
  main_release: 1,
  version_family: 1,
};

describe("Route GET users-me-devices", () => {
  beforeEach(async () => {
    await tryber.tables.WpAppqEvdProfile.do().insert(tester1);
    await tryber.tables.WpCrowdAppqDevice.do().insert([
      { ...device1, id: 1, form_factor: "Smart-tv" },
      { ...device1, id: 2, form_factor: "Tablet" },
      {
        ...device1,
        id: 3,
        form_factor: "PC",
        pc_type: "Notebook",
      },
      { ...device1, id: 4, form_factor: "Smartphone" },
    ]);
    await tryber.tables.WpAppqEvdPlatform.do().insert(platform1);
    await tryber.tables.WpAppqOs.do().insert(os1);
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await tryber.tables.WpAppqEvdProfile.do().delete();
      await tryber.tables.WpCrowdAppqDevice.do().delete();
      await tryber.tables.WpAppqEvdPlatform.do().delete();
      await tryber.tables.WpAppqOs.do().delete();
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
    expect(response.body.length).toBe(4);
    expect(response.body).toEqual([
      {
        id: 4,
        type: "Smartphone",
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
      },
      {
        id: 3,
        type: "PC",
        operating_system: {
          id: os1.id,
          platform: platform1.name,
          version: os1.display_name + " (" + os1.version_number + ")",
        },
        device: {
          pc_type: "Notebook",
        },
      },
      {
        id: 2,
        type: "Tablet",
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
      },
      {
        id: 1,
        type: "Smart-tv",
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
      },
    ]);
  });
});

describe("Route GET users-me-devices when the user hasn't devices", () => {
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await tryber.tables.WpAppqEvdProfile.do().insert(tester1);
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await tryber.tables.WpAppqEvdProfile.do().delete();
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
    await tryber.tables.WpAppqEvdProfile.do().insert(tester1);
    await tryber.tables.WpCrowdAppqDevice.do().insert(deviceDisabled);
    await tryber.tables.WpAppqEvdPlatform.do().insert(platform1);
    await tryber.tables.WpAppqOs.do().insert(os1);
  });
  afterEach(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpCrowdAppqDevice.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
    await tryber.tables.WpAppqOs.do().delete();
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
