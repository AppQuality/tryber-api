import app from "@src/app";
import { data as expData } from "@src/__mocks__/mockedDb/experience";
import { data as userLevelData } from "@src/__mocks__/mockedDb/levels";
import Levels from "@src/__mocks__/mockedDb/levelsDefinition";
import { data as levelRevData } from "@src/__mocks__/mockedDb/levelsRevisions";
import Profile from "@src/__mocks__/mockedDb/profile";
import request from "supertest";

const mockedLevelDefinitions = () => {
  Levels.insert({
    id: 10,
    name: "Basic",
    hold_exp_pts: 0,
    reach_exp_pts: 0,
  });
  Levels.insert({
    id: 20,
    name: "Bronze",
    hold_exp_pts: 50,
    reach_exp_pts: 100,
  });
  Levels.insert({
    id: 30,
    name: "Silver",
    hold_exp_pts: 150,
    reach_exp_pts: 250,
  });
  Levels.insert({
    id: 40,
    name: "Gold",
    hold_exp_pts: 300,
    reach_exp_pts: 500,
  });

  Levels.insert({
    id: 50,
    name: "Platinum",
    hold_exp_pts: 600,
    reach_exp_pts: 1000,
  });
  Levels.insert({
    id: 60,
    name: "Diamond",
    hold_exp_pts: 2000,
    reach_exp_pts: 3000,
  });
  Levels.insert({
    id: 100,
    name: "Legendary",
    hold_exp_pts: undefined,
    reach_exp_pts: undefined,
  });
};
const firstDayOfLastMonth = () => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - 1);
  return date;
};
describe("Route GET users-me-rank", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      Profile.insert({ pending_booty: 100 });
      Profile.insert({ id: 2 });
      Profile.insert({ id: 3 });
      mockedLevelDefinitions();
      userLevelData.basicLevel();
      userLevelData.basicLevel({ id: 2, tester_id: 2 });
      userLevelData.basicLevel({ id: 3, tester_id: 3 });
      expData.basicExperience({ amount: 99 });
      expData.basicExperience({ id: 2, tester_id: 2, amount: 69 });
      expData.basicExperience({ id: 3, tester_id: 3, amount: 169 });
      levelRevData.basicLevelRev({
        level_id: 20,
        start_date: firstDayOfLastMonth()
          .toISOString()
          .split(".")[0]
          .replace("T", " "),
      });
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      Profile.clear();
      Levels.clear();
      userLevelData.drop();
      expData.drop();
      levelRevData.drop();
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
      Profile.insert();
      mockedLevelDefinitions();
      userLevelData.basicLevel({ level_id: 20 });
      expData.basicExperience({ amount: 20 });
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      Profile.clear();
      Levels.clear();
      userLevelData.drop();
      expData.drop();
      levelRevData.drop();
      resolve(null);
    });
  });
  it("Should return current Level Bronze as prospect level", async () => {
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
      Profile.insert();
      mockedLevelDefinitions();
      userLevelData.basicLevel({ level_id: 30 });
      expData.basicExperience({ amount: 50 });
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      Profile.clear();
      Levels.clear();
      userLevelData.drop();
      expData.drop();
      levelRevData.drop();
      resolve(null);
    });
  });

  it("Should return current level Silver as prospect level", async () => {
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
});
describe("Route GET users-me-rank - Upgrade Basic to Silver", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      Profile.insert();
      mockedLevelDefinitions();
      userLevelData.basicLevel({ level_id: 10 });
      expData.basicExperience({ amount: 300 });
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      Profile.clear();
      Levels.clear();
      userLevelData.drop();
      expData.drop();
      levelRevData.drop();
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
      Profile.insert({ pending_booty: 100 });
      mockedLevelDefinitions();
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      Profile.clear();
      Levels.clear();
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
      Profile.insert({ pending_booty: 100 });
      mockedLevelDefinitions();
      userLevelData.basicLevel();
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      Profile.clear();
      Levels.clear();
      userLevelData.drop();
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
      Profile.insert({ pending_booty: 100 });
      mockedLevelDefinitions();
      userLevelData.basicLevel();
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      Profile.clear();
      Levels.clear();
      userLevelData.drop();
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
      Profile.insert({ pending_booty: 100 });
      mockedLevelDefinitions();
      userLevelData.basicLevel({ level_id: 100 });
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      Profile.clear();
      Levels.clear();
      userLevelData.drop();
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
describe("Route GET users-me-rank - Legendary Prospect User", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      Profile.insert({
        total_exp_pts: 9999999,
      });
      mockedLevelDefinitions();
      userLevelData.basicLevel({ level_id: 30 });
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      Profile.clear();
      Levels.clear();
      userLevelData.drop();
      resolve(null);
    });
  });
  it("As a non-legendary user with 100000+ exp points i should have legendary as prospect level", async () => {
    const response = await request(app)
      .get("/users/me/rank")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("prospect");
    expect(response.body.prospect).toHaveProperty("level", {
      id: 100,
      name: "Legendary",
    });
    expect(response.body.prospect).not.toHaveProperty("next");
    expect(response.body.prospect).not.toHaveProperty("maintenance");
  });
});

describe("Route GET users-me-rank - Diamond that can't reach legendary", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      Profile.insert({
        total_exp_pts: 10000,
      });
      mockedLevelDefinitions();
      userLevelData.basicLevel({ level_id: 60 });
      expData.basicExperience({ amount: 2500 });
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      Profile.clear();
      Levels.clear();
      userLevelData.drop();
      resolve(null);
    });
  });
  it("As a diamond user with less than 100000 exp points i shouldn't have prospect next", async () => {
    const response = await request(app)
      .get("/users/me/rank")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("prospect");
    expect(response.body.prospect).toHaveProperty("level", {
      id: 60,
      name: "Diamond",
    });
    expect(response.body.prospect).not.toHaveProperty("next");
  });
});
