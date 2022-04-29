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

const createTesterData = async (params: {
  testerId: number;
  name: string;
  surname: string;
  shortname: string;
  exp: number;
  image_name: string;
}) => {
  let tester = await profileData.basicTester({
    id: params.testerId,
    wp_user_id: params.testerId + 10,
    name: params.name,
    surname: params.surname,
  });
  tester.short_name = params.shortname;
  tester.image = `https://eu.ui-avatars.com/api/${params.image_name}/132---${tester.email}---132`;
  tester.exp = await expData.basicExperience({
    id: params.testerId + 100,
    tester_id: tester.id,
    amount: params.exp,
  });
  tester.level = await levelData.basicLevel({
    id: params.testerId + 1000,
    tester_id: tester.id,
    level_id: 10,
  });
  return tester;
};

const shouldShowFirstNineTesters = (data: any) => {
  return async () => {
    const response = await request(app)
      .get("/users/me/rank/list")
      .set("authorization", "Bearer tester");
    expect(response.body).toHaveProperty("peers");
    expect(response.body.peers).toEqual([
      {
        position: 1,
        image: data.tester1.image,
        name: data.tester1.short_name,
        id: data.tester1.id,
        monthly_exp: data.tester1.exp.amount,
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
      {
        position: 4,
        image: data.tester5.image,
        name: data.tester5.short_name,
        id: data.tester5.id,
        monthly_exp: data.tester5.exp.amount,
      },
      {
        position: 5,
        image: data.tester6.image,
        name: data.tester6.short_name,
        id: data.tester6.id,
        monthly_exp: data.tester6.exp.amount,
      },
      {
        position: 6,
        image: data.tester7.image,
        name: data.tester7.short_name,
        id: data.tester7.id,
        monthly_exp: data.tester7.exp.amount,
      },
      {
        position: 7,
        image: data.tester8.image,
        name: data.tester8.short_name,
        id: data.tester8.id,
        monthly_exp: data.tester8.exp.amount,
      },
      {
        position: 8,
        image: data.tester9.image,
        name: data.tester9.short_name,
        id: data.tester9.id,
        monthly_exp: data.tester9.exp.amount,
      },
      {
        position: 9,
        image: data.tester3.image,
        name: data.tester3.short_name,
        id: data.tester3.id,
        monthly_exp: data.tester3.exp.amount,
      },
    ]);
  };
};

describe("GET /users/me/rank/list - Is first", () => {
  const data: any = {};
  beforeAll(async () => {
    await profileTable.create();
    await levelTable.create();
    await expTable.create();
    data.tester1 = await createTesterData({
      testerId: 1,
      name: "Pippo",
      surname: "Pluto",
      exp: 1000,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    data.tester2 = await createTesterData({
      testerId: 2,
      name: "Pippo",
      surname: "Franco",
      exp: 100,
      shortname: "Pippo F.",
      image_name: "pippo+f",
    });
    data.tester3 = await createTesterData({
      testerId: 3,
      name: "Giorgio",
      surname: "Giovanna",
      exp: 10,
      shortname: "Giorgio G.",
      image_name: "giorgio+g",
    });
    data.tester4 = await createTesterData({
      testerId: 4,
      name: "Carlo",
      surname: "Martello",
      exp: 90,
      shortname: "Carlo M.",
      image_name: "carlo+m",
    });
    data.tester5 = await createTesterData({
      testerId: 5,
      name: "Pippo",
      surname: "Pluto",
      exp: 80,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    data.tester6 = await createTesterData({
      testerId: 6,
      name: "Pippo",
      surname: "Pluto",
      exp: 70,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    data.tester7 = await createTesterData({
      testerId: 7,
      name: "Pippo",
      surname: "Pluto",
      exp: 65,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    data.tester8 = await createTesterData({
      testerId: 8,
      name: "Pippo",
      surname: "Pluto",
      exp: 60,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    data.tester9 = await createTesterData({
      testerId: 9,
      name: "Pippo",
      surname: "Pluto",
      exp: 40,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    return null;
  });
  afterAll(async () => {
    await profileTable.drop();
    await expTable.drop();
    await levelTable.drop();
    return null;
  });
  it(
    "Should return me and the next 8 testers as peers",
    shouldShowFirstNineTesters(data)
  );
});

describe("GET /users/me/rank/list - Is second", () => {
  const data: any = {};
  beforeAll(async () => {
    await profileTable.create();
    await levelTable.create();
    await expTable.create();
    data.tester1 = await createTesterData({
      testerId: 2,
      name: "Pippo",
      surname: "Pluto",
      exp: 1000,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    data.tester2 = await createTesterData({
      testerId: 1,
      name: "Pippo",
      surname: "Franco",
      exp: 100,
      shortname: "Pippo F.",
      image_name: "pippo+f",
    });
    data.tester3 = await createTesterData({
      testerId: 3,
      name: "Giorgio",
      surname: "Giovanna",
      exp: 10,
      shortname: "Giorgio G.",
      image_name: "giorgio+g",
    });
    data.tester4 = await createTesterData({
      testerId: 4,
      name: "Carlo",
      surname: "Martello",
      exp: 90,
      shortname: "Carlo M.",
      image_name: "carlo+m",
    });
    data.tester5 = await createTesterData({
      testerId: 5,
      name: "Pippo",
      surname: "Pluto",
      exp: 80,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    data.tester6 = await createTesterData({
      testerId: 6,
      name: "Pippo",
      surname: "Pluto",
      exp: 70,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    data.tester7 = await createTesterData({
      testerId: 7,
      name: "Pippo",
      surname: "Pluto",
      exp: 65,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    data.tester8 = await createTesterData({
      testerId: 8,
      name: "Pippo",
      surname: "Pluto",
      exp: 60,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    data.tester9 = await createTesterData({
      testerId: 9,
      name: "Pippo",
      surname: "Pluto",
      exp: 40,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    return null;
  });
  afterAll(async () => {
    await profileTable.drop();
    await expTable.drop();
    await levelTable.drop();
    return null;
  });
  it(
    "Should return the first tester, me, and the next 7 testers as peers",
    shouldShowFirstNineTesters(data)
  );
});

describe("GET /users/me/rank/list - Is third", () => {
  const data: any = {};
  beforeAll(async () => {
    await profileTable.create();
    await levelTable.create();
    await expTable.create();
    data.tester1 = await createTesterData({
      testerId: 3,
      name: "Pippo",
      surname: "Pluto",
      exp: 1000,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    data.tester2 = await createTesterData({
      testerId: 2,
      name: "Pippo",
      surname: "Franco",
      exp: 100,
      shortname: "Pippo F.",
      image_name: "pippo+f",
    });
    data.tester3 = await createTesterData({
      testerId: 1,
      name: "Giorgio",
      surname: "Giovanna",
      exp: 10,
      shortname: "Giorgio G.",
      image_name: "giorgio+g",
    });
    data.tester4 = await createTesterData({
      testerId: 4,
      name: "Carlo",
      surname: "Martello",
      exp: 90,
      shortname: "Carlo M.",
      image_name: "carlo+m",
    });
    data.tester5 = await createTesterData({
      testerId: 5,
      name: "Pippo",
      surname: "Pluto",
      exp: 80,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    data.tester6 = await createTesterData({
      testerId: 6,
      name: "Pippo",
      surname: "Pluto",
      exp: 70,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    data.tester7 = await createTesterData({
      testerId: 7,
      name: "Pippo",
      surname: "Pluto",
      exp: 65,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    data.tester8 = await createTesterData({
      testerId: 8,
      name: "Pippo",
      surname: "Pluto",
      exp: 60,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    data.tester9 = await createTesterData({
      testerId: 9,
      name: "Pippo",
      surname: "Pluto",
      exp: 40,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    return null;
  });
  afterAll(async () => {
    await profileTable.drop();
    await expTable.drop();
    await levelTable.drop();
    return null;
  });
  it(
    "Should return the first 2 tester, me, and the next 6 testers as peers",
    shouldShowFirstNineTesters(data)
  );
});

describe("GET /users/me/rank/list - Is fourth", () => {
  const data: any = {};
  beforeAll(async () => {
    await profileTable.create();
    await levelTable.create();
    await expTable.create();
    data.tester1 = await createTesterData({
      testerId: 4,
      name: "Pippo",
      surname: "Pluto",
      exp: 1000,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    data.tester2 = await createTesterData({
      testerId: 2,
      name: "Pippo",
      surname: "Franco",
      exp: 100,
      shortname: "Pippo F.",
      image_name: "pippo+f",
    });
    data.tester3 = await createTesterData({
      testerId: 3,
      name: "Giorgio",
      surname: "Giovanna",
      exp: 10,
      shortname: "Giorgio G.",
      image_name: "giorgio+g",
    });
    data.tester4 = await createTesterData({
      testerId: 1,
      name: "Carlo",
      surname: "Martello",
      exp: 90,
      shortname: "Carlo M.",
      image_name: "carlo+m",
    });
    data.tester5 = await createTesterData({
      testerId: 5,
      name: "Pippo",
      surname: "Pluto",
      exp: 80,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    data.tester6 = await createTesterData({
      testerId: 6,
      name: "Pippo",
      surname: "Pluto",
      exp: 70,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    data.tester7 = await createTesterData({
      testerId: 7,
      name: "Pippo",
      surname: "Pluto",
      exp: 65,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    data.tester8 = await createTesterData({
      testerId: 8,
      name: "Pippo",
      surname: "Pluto",
      exp: 60,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    data.tester9 = await createTesterData({
      testerId: 9,
      name: "Pippo",
      surname: "Pluto",
      exp: 40,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    return null;
  });
  afterAll(async () => {
    await profileTable.drop();
    await expTable.drop();
    await levelTable.drop();
    return null;
  });
  it(
    "Should return the first 3 tester, me, and the next 5 testers as peers",
    shouldShowFirstNineTesters(data)
  );
});
