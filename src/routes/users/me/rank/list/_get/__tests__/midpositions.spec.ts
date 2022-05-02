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
const createTesterData = async ({ id, exp }: { id?: number; exp: number }) => {
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
  });
};

describe("GET /users/me/rank/list - Is first", () => {
  const data: any = {};
  beforeAll(async () => {
    await profileTable.create();
    await levelTable.create();
    await expTable.create();
    data.tester1 = await createTesterData({ exp: 100 });
    data.tester2 = await createTesterData({ exp: 99 });
    data.tester3 = await createTesterData({ exp: 98 });
    data.tester4 = await createTesterData({ exp: 97 });
    data.tester5 = await createTesterData({ exp: 96 });
    data.tester6 = await createTesterData({ exp: 95 });
    data.tester7 = await createTesterData({ exp: 94 });
    data.tester8 = await createTesterData({ exp: 93 });
    data.tester9 = await createTesterData({ exp: 92 });
    data.tester10 = await createTesterData({ exp: 91 });
    data.tester11 = await createTesterData({ exp: 90 });
    data.tester12 = await createTesterData({ id: 1, exp: 89 });
    data.tester13 = await createTesterData({ exp: 88 });
    data.tester14 = await createTesterData({ exp: 87 });
    data.tester15 = await createTesterData({ exp: 86 });
    data.tester16 = await createTesterData({ exp: 85 });
    data.tester17 = await createTesterData({ exp: 84 });
    return null;
  });
  afterAll(async () => {
    await profileTable.drop();
    await expTable.drop();
    await levelTable.drop();
    return null;
  });
  it("Should return from 9 to 17 position as peers", async () => {
    const response = await request(app)
      .get("/users/me/rank/list")
      .set("authorization", "Bearer tester");
    expect(response.body).toHaveProperty("peers");
    expect(response.body.peers).toEqual([
      {
        position: 8,
        image: data.tester8.image,
        name: data.tester8.short_name,
        id: data.tester8.id,
        monthly_exp: data.tester8.exp.amount,
      },
      {
        position: 9,
        image: data.tester9.image,
        name: data.tester9.short_name,
        id: data.tester9.id,
        monthly_exp: data.tester9.exp.amount,
      },
      {
        position: 10,
        image: data.tester10.image,
        name: data.tester10.short_name,
        id: data.tester10.id,
        monthly_exp: data.tester10.exp.amount,
      },
      {
        position: 11,
        image: data.tester11.image,
        name: data.tester11.short_name,
        id: data.tester11.id,
        monthly_exp: data.tester11.exp.amount,
      },
      {
        position: 12,
        image: data.tester12.image,
        name: data.tester12.short_name,
        id: data.tester12.id,
        monthly_exp: data.tester12.exp.amount,
      },
      {
        position: 13,
        image: data.tester13.image,
        name: data.tester13.short_name,
        id: data.tester13.id,
        monthly_exp: data.tester13.exp.amount,
      },
      {
        position: 14,
        image: data.tester14.image,
        name: data.tester14.short_name,
        id: data.tester14.id,
        monthly_exp: data.tester14.exp.amount,
      },
      {
        position: 15,
        image: data.tester15.image,
        name: data.tester15.short_name,
        id: data.tester15.id,
        monthly_exp: data.tester15.exp.amount,
      },
      {
        position: 16,
        image: data.tester16.image,
        name: data.tester16.short_name,
        id: data.tester16.id,
        monthly_exp: data.tester16.exp.amount,
      },
    ]);
  });
});
