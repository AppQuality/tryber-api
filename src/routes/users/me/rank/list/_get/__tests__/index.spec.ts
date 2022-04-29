import {
  data as expData,
  table as expTable,
} from "@src/__mocks__/mockedDb/experience";
import {
  data as levelData,
  table as levelTable,
} from "@src/__mocks__/mockedDb/levels";
import {
  data as profileData,
  table as profileTable,
} from "@src/__mocks__/mockedDb/profile";
import app from "@src/app";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");

describe("GET /users/me/rank/list", () => {
  const data: any = {};
  beforeAll(async () => {
    await profileTable.create();
    await levelTable.create();
    await expTable.create();
    data.tester1 = await profileData.basicTester({
      id: 1,
      wp_user_id: 1,
      name: "Pippo",
      surname: "Pluto",
    });
    data.tester1.short_name = "Pippo P.";
    data.tester1.exp = await expData.basicExperience({
      id: 1,
      tester_id: data.tester1.id,
      amount: 10,
    });
    data.tester1.level = await levelData.basicLevel({
      id: 1,
      tester_id: data.tester1.id,
      level_id: 10,
    });
    data.tester2 = await profileData.basicTester({
      id: 2,
      wp_user_id: 2,
      name: "Pippo",
      surname: "Franco",
    });
    data.tester2.short_name = "Pippo F.";
    data.tester2.exp = await expData.basicExperience({
      id: 2,
      tester_id: data.tester2.id,
      amount: 100,
    });
    data.tester2.level = await levelData.basicLevel({
      id: 2,
      tester_id: data.tester2.id,
      level_id: 10,
    });
    data.tester3 = await profileData.basicTester({
      id: 3,
      wp_user_id: 3,
      name: "Giorgio",
      surname: "Giovanna",
    });

    data.tester3.short_name = "Giorgio G.";
    data.tester3.exp = await expData.basicExperience({
      id: 3,
      tester_id: data.tester3.id,
      amount: 1000,
    });
    data.tester3.level = await levelData.basicLevel({
      id: 3,
      tester_id: data.tester3.id,
      level_id: 10,
    });

    data.tester4 = await profileData.basicTester({
      id: 4,
      wp_user_id: 4,
      name: "Carlo",
      surname: "Martello",
    });
    data.tester4.short_name = "Carlo M.";
    data.tester4.exp = await expData.basicExperience({
      id: 4,
      tester_id: data.tester4.id,
      amount: 20,
    });
    data.tester4.level = await levelData.basicLevel({
      id: 4,
      tester_id: data.tester4.id,
      level_id: 10,
    });

    return null;
  });
  afterAll(async () => {
    await profileTable.drop();
    await expTable.drop();
    await levelTable.drop();
    return null;
  });
  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/users/me/rank/list");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged in", async () => {
    const response = await request(app)
      .get("/users/me/rank/list")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should have 3 items as tops", async () => {
    const response = await request(app)
      .get("/users/me/rank/list")
      .set("authorization", "Bearer tester");
    expect(response.body).toHaveProperty("tops");
    expect(response.body.tops.length).toBe(3);
  });
  it("Should the tester with most exp as tops", async () => {
    const response = await request(app)
      .get("/users/me/rank/list")
      .set("authorization", "Bearer tester");
    expect(response.body).toHaveProperty("tops");
    expect(response.body.tops).toEqual([
      {
        position: 1,
        image: "https://placekitten.com/200/200",
        name: data.tester3.short_name,
        id: data.tester3.id,
        monthly_exp: data.tester3.exp.amount,
      },
      {
        position: 2,
        image: "https://placekitten.com/200/200",
        name: data.tester2.short_name,
        id: data.tester2.id,
        monthly_exp: data.tester2.exp.amount,
      },
      {
        position: 3,
        image: "https://placekitten.com/200/200",
        name: data.tester4.short_name,
        id: data.tester4.id,
        monthly_exp: data.tester4.exp.amount,
      },
    ]);
  });
});
