import { table as expTable } from "@src/__mocks__/mockedDb/experience";
import { table as levelTable } from "@src/__mocks__/mockedDb/levels";
import { table as profileTable } from "@src/__mocks__/mockedDb/profile";
import app from "@src/app";
import request from "supertest";

import createTesterBasicData from "./createTesterData";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");
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
    await profileTable.create();
    await levelTable.create();
    await expTable.create();
    data.tester1 = await createTesterData({ id: 1, exp: 0, level: false });
    return null;
  });
  afterAll(async () => {
    await profileTable.drop();
    await expTable.drop();
    await levelTable.drop();
    return null;
  });
  it("Should answer 404 if tester is not ranked", async () => {
    const response = await request(app)
      .get("/users/me/rank/list")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(404);
  });
});
