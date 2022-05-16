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
  data as levelRevData,
  table as levelRevTable,
} from "@src/__mocks__/mockedDb/levelsRevisions";
import {
  data as profileData,
  table as profileTable,
} from "@src/__mocks__/mockedDb/profile";
import app from "@src/app";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");

const mockedLevelDefinitions = () => {
  levelDefData.basicLevel();
  levelDefData.basicLevel({
    id: 20,
    name: "Bronze",
    hold_exp_pts: 50,
    reach_exp_pts: 100,
  });
  levelDefData.basicLevel({
    id: 30,
    name: "Silver",
    hold_exp_pts: 150,
    reach_exp_pts: 250,
  });
  levelDefData.basicLevel({
    id: 40,
    name: "Gold",
    hold_exp_pts: 300,
    reach_exp_pts: 500,
  });

  levelDefData.basicLevel({
    id: 50,
    name: "Platinum",
    hold_exp_pts: 600,
    reach_exp_pts: 1000,
  });
  levelDefData.basicLevel({
    id: 60,
    name: "Legendary",
    hold_exp_pts: undefined,
    reach_exp_pts: undefined,
  });
};
describe("Route GET users-me-rank", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      profileTable.create();
      profileData.testerWithBooty();
      profileData.basicTester({ id: 2 });
      profileData.basicTester({ id: 3 });
      levelDefTable.create();
      mockedLevelDefinitions();
      userLevelTable.create();
      userLevelData.basicLevel();
      userLevelData.basicLevel({ id: 2, tester_id: 2 });
      userLevelData.basicLevel({ id: 3, tester_id: 3 });
      expTable.create();
      expData.basicExperience({ amount: 99 });
      expData.basicExperience({ id: 2, tester_id: 2, amount: 69 });
      expData.basicExperience({ id: 3, tester_id: 3, amount: 169 });
      levelRevTable.create();
      levelRevData.basicLevelRev({
        level_id: 20,
        start_date: new Date(new Date().setMonth(new Date().getMonth() - 1))
          .toISOString()
          .split(".")[0]
          .replace("T", " "),
      });
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      profileTable.drop();
      levelDefTable.drop();
      userLevelTable.drop();
      expTable.drop();
      levelRevTable.drop();
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
    expect(response.body).toHaveProperty("points", 99);
  });
  it("Should return previous users level", async () => {
    const response = await request(app)
      .get("/users/me/rank")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("previousLevel", {
      id: 20,
      name: "Bronze",
    });
  });
  it("Should return rank position as 2", async () => {
    const response = await request(app)
      .get("/users/me/rank")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("rank", 2);
  });
  it("Should return basic as prospect level", async () => {
    const response = await request(app)
      .get("/users/me/rank")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("prospect");
    expect(response.body.prospect).toHaveProperty("level", {
      id: 10,
      name: "Basic",
    });
  });
});

describe("Route GET users-me-rank - Downgrade Bronze to Basic", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      profileTable.create();
      profileData.basicTester();
      levelDefTable.create();
      mockedLevelDefinitions();
      userLevelTable.create();
      userLevelData.basicLevel({ level_id: 20 });
      expTable.create();
      expData.basicExperience({ amount: 20 });
      levelRevTable.create();
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      profileTable.drop();
      levelDefTable.drop();
      userLevelTable.drop();
      expTable.drop();
      levelRevTable.drop();
      resolve(null);
    });
  });
  it("Should return basic as prospect level", async () => {
    const response = await request(app)
      .get("/users/me/rank")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("prospect");
    expect(response.body.prospect).toHaveProperty("level", {
      id: 10,
      name: "Basic",
    });
  });
  it("Should return the exp points missing to maintain level", async () => {
    const response = await request(app)
      .get("/users/me/rank")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("prospect");
    expect(response.body.prospect).toHaveProperty("maintenance", 30);
  });
});
describe("Route GET users-me-rank - Downgrade Silver to Bronze", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      profileTable.create();
      profileData.basicTester();
      levelDefTable.create();
      mockedLevelDefinitions();
      userLevelTable.create();
      userLevelData.basicLevel({ level_id: 30 });
      expTable.create();
      expData.basicExperience({ amount: 50 });
      levelRevTable.create();
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      profileTable.drop();
      levelDefTable.drop();
      userLevelTable.drop();
      expTable.drop();
      levelRevTable.drop();
      resolve(null);
    });
  });

  it("Should return Bronze as prospect level", async () => {
    const response = await request(app)
      .get("/users/me/rank")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("prospect");
    expect(response.body.prospect).toHaveProperty("level", {
      id: 20,
      name: "Bronze",
    });
  });
});
describe("Route GET users-me-rank - Upgrade Basic to Silver", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      profileTable.create();
      profileData.basicTester();
      levelDefTable.create();
      mockedLevelDefinitions();
      userLevelTable.create();
      userLevelData.basicLevel({ level_id: 10 });
      expTable.create();
      expData.basicExperience({ amount: 300 });
      levelRevTable.create();
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      profileTable.drop();
      levelDefTable.drop();
      userLevelTable.drop();
      expTable.drop();
      levelRevTable.drop();
      resolve(null);
    });
  });

  it("Should return silver as prospect level", async () => {
    const response = await request(app)
      .get("/users/me/rank")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("prospect");
    expect(response.body.prospect).toHaveProperty("level", {
      id: 30,
      name: "Silver",
    });
  });
  it("Should return the exp points needed for next level", async () => {
    const response = await request(app)
      .get("/users/me/rank")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("prospect");
    expect(response.body.prospect).toHaveProperty("next");
    expect(response.body.prospect.next).toHaveProperty("points", 200);
  });
});

describe("Route GET users-me-rank - No level user", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      profileTable.create();
      profileData.testerWithBooty();
      levelDefTable.create();
      mockedLevelDefinitions();
      userLevelTable.create();
      expTable.create();
      levelRevTable.create();
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      profileTable.drop();
      levelDefTable.drop();
      userLevelTable.drop();
      expTable.drop();
      levelRevTable.drop();
      resolve(null);
    });
  });
  it("Should return id=0 name=No Level if has not level", async () => {
    const response = await request(app)
      .get("/users/me/rank")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("level", { id: 0, name: "No Level" });
  });
});
describe("Route GET users-me-rank - No previous level", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      profileTable.create();
      profileData.testerWithBooty();
      levelDefTable.create();
      mockedLevelDefinitions();
      userLevelTable.create();
      userLevelData.basicLevel();
      levelRevTable.create();
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
      levelRevTable.drop();
      resolve(null);
    });
  });
  it("Should return no level as previous users level", async () => {
    const response = await request(app)
      .get("/users/me/rank")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("previousLevel", {
      id: 0,
      name: "No Level",
    });
  });
});
describe("Route GET users-me-rank - No montly points", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      profileTable.create();
      profileData.testerWithBooty();
      levelDefTable.create();
      mockedLevelDefinitions();
      userLevelTable.create();
      userLevelData.basicLevel();
      levelRevTable.create();
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
      levelRevTable.drop();
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
describe("Route GET users-me-rank - Legendary User", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      profileTable.create();
      profileData.testerWithBooty();
      levelDefTable.create();
      mockedLevelDefinitions();
      userLevelTable.create();
      userLevelData.basicLevel({ level_id: 100 });
      levelRevTable.create();
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
      levelRevTable.drop();
      resolve(null);
    });
  });
  it("As a legendary user the response's prospect has no next and has no maintenance", async () => {
    const response = await request(app)
      .get("/users/me/rank")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("prospect");
    expect(response.body.prospect).not.toHaveProperty("next");
    expect(response.body.prospect).not.toHaveProperty("maintenance");
  });
  it("As a legendary user the response's prospect has level Legendary with id 100", async () => {
    const response = await request(app)
      .get("/users/me/rank")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("prospect");
    expect(response.body.prospect).toHaveProperty("level");
    expect(response.body.prospect.level).toMatchObject({
      id: 100,
      name: "Legendary",
    });
  });
});
