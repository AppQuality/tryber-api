import app from "@src/app";
import { data as expData } from "@src/__mocks__/mockedDb/experience";
import { data as levelData } from "@src/__mocks__/mockedDb/levels";
import { data as profileData } from "@src/__mocks__/mockedDb/profile";
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

const ids: number[] = [];
const createTesterData = async ({
  id,
  exp,
  level,
}: {
  id?: number;
  exp: number;
  level?: false | number;
}) => {
  if (!id) {
    id = Math.floor(Math.random() * 100);
    while (id === 1 || ids.includes(id)) {
      id = Math.floor(Math.random() * 100);
    }
  }
  ids.push(id);
  return await createTesterBasicData({
    testerId: id,
    name: "Pippo",
    surname: "Pluto",
    exp: exp,
    shortname: "Pippo P.",
    image_name: "pippo+p",
    level: level,
  });
};

describe("GET /users/me/rank/list - No exp", () => {
  const data: any = {};
  beforeAll(async () => {
    data.tester1 = await createTesterData({ id: 1, exp: 0, level: false });
    return null;
  });
  afterAll(async () => {
    await expData.drop();
    await profileData.drop();
    await levelData.drop();
    return null;
  });
  it("Should answer 404 if tester is not ranked", async () => {
    const response = await request(app)
      .get("/users/me/rank/list")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(404);
  });
});
