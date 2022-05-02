import {
  data as expData,
  table as expTable,
} from "@src/__mocks__/mockedDb/experience";
import {
  data as userLevelData,
  table as userLevelTable,
} from "@src/__mocks__/mockedDb/levels";
import {
  data as levelDefData,
  table as levelDefTable,
} from "@src/__mocks__/mockedDb/levelsDefinition";
import {
  data as profileData,
  table as profileTable,
} from "@src/__mocks__/mockedDb/profile";
import app from "@src/app";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");

describe("Route GET users-me-rank", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      profileTable.create();
      profileData.testerWithBooty();
      levelDefTable.create();
      levelDefData.basicLevel();
      userLevelTable.create();
      userLevelData.basicLevel();
      expTable.create();
      expData.basicExperience();
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      profileTable.drop();
      levelDefTable.drop();
      userLevelTable.drop();
      expTable.drop();
      resolve(null);
    });
  });

  it("Should return 403 if does not logged in", async () => {
    const response = await request(app).get("/users/me/rank");
    expect(response.status).toBe(403);
  });
  it("Should return 200 if logged in", async () => {
    const response = await request(app)
      .get("/users/me/rank")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should return user current level", async () => {
    const response = await request(app)
      .get("/users/me/rank")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("level", { id: 10, name: "Basic" });
  });
  it("Should return user monthly exp points", async () => {
    const response = await request(app)
      .get("/users/me/rank")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("points", 100);
  });
});

describe("Route GET users-me-rank no level user", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      profileTable.create();
      profileData.testerWithBooty();
      levelDefTable.create();
      levelDefData.basicLevel();
      userLevelTable.create();
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      profileTable.drop();
      levelDefTable.drop();
      userLevelTable.drop();
      resolve(null);
    });
  });
  it("Should return 404 if has not level", async () => {
    const response = await request(app)
      .get("/users/me/rank")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(404);
  });
});

describe("Route GET users-me-rank no montly points", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      profileTable.create();
      profileData.testerWithBooty();
      levelDefTable.create();
      levelDefData.basicLevel();
      userLevelTable.create();
      userLevelData.basicLevel();
      expTable.create();
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      profileTable.drop();
      levelDefTable.drop();
      userLevelTable.drop();
      expTable.drop();
      resolve(null);
    });
  });
  it("Should return 0 points if user hasn't montly exp pts", async () => {
    const response = await request(app)
      .get("/users/me/rank")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("points", 0);
  });
});
