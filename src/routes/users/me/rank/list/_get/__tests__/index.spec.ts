import app from "@src/app";
import Experience from "@src/__mocks__/mockedDb/experience";
import UserLevels from "@src/__mocks__/mockedDb/levels";
import Profile from "@src/__mocks__/mockedDb/profile";
import request from "supertest";
import createTesterBasicData from "./createTesterData";

jest.mock("avatar-initials", () => {
  return {
    gravatarUrl: jest.fn(
      ({
        fallback,
        email,
        size,
      }: {
        fallback: string;
        email: string;
        size: number;
      }) => `${fallback}---${email}---${size}`
    ),
  };
});

describe("GET /users/me/rank/list", () => {
  const data: any = {};
  beforeAll(async () => {
    data.tester1 = await createTesterBasicData({
      testerId: 1,
      name: "Pippo",
      surname: "Pluto",
      shortname: "Pippo P.",
      image_name: "pippo+p",
      exp: 10,
    });
    data.tester2 = await createTesterBasicData({
      testerId: 2,
      name: "Pippo",
      surname: "Franco",
      shortname: "Pippo F.",
      image_name: "pippo+f",
      exp: 100,
    });
    data.tester3 = await createTesterBasicData({
      testerId: 3,
      name: "Giorgio",
      surname: "Giovanna",
      shortname: "Giorgio G.",
      image_name: "giorgio+g",
      exp: 1000,
    });

    data.tester4 = await createTesterBasicData({
      testerId: 4,
      name: "Carlo",
      surname: "Martello",
      shortname: "Carlo M.",
      image_name: "carlo+m",
      exp: 20,
    });
    data.tester5 = await createTesterBasicData({
      testerId: 5,
      name: "Carlo",
      surname: "Martello",
      shortname: "Carlo M.",
      image_name: "carlo+m",
      exp: 10000,
      level: 20,
    });

    return null;
  });
  afterAll(async () => {
    await Experience.clear();
    await Profile.clear();
    await UserLevels.clear();
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
        image: data.tester3.image,
        name: data.tester3.short_name,
        id: data.tester3.id,
        monthly_exp: data.tester3.exp.amount,
      },
      {
        position: 2,
        image: data.tester2.image,
        name: data.tester2.short_name,
        id: data.tester2.id,
        monthly_exp: data.tester2.exp.amount,
      },
      {
        position: 3,
        image: data.tester4.image,
        name: data.tester4.short_name,
        id: data.tester4.id,
        monthly_exp: data.tester4.exp.amount,
      },
    ]);
  });
  it("Should show only tester with my level", async () => {
    const response = await request(app)
      .get("/users/me/rank/list")
      .set("authorization", "Bearer tester");
    expect(response.body).toHaveProperty("tops");
    for (const tester of response.body.tops) {
      expect(tester.id).not.toBe(data.tester5.id);
    }
    expect(response.body).toHaveProperty("peers");
    for (const tester of response.body.peers) {
      expect(tester.id).not.toBe(data.tester5.id);
    }
  });
});
