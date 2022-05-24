import { data as expData } from "@src/__mocks__/mockedDb/experience";
import { data as levelData } from "@src/__mocks__/mockedDb/levels";
import { data as profileData } from "@src/__mocks__/mockedDb/profile";
import createTesterData from "./createTesterData";
import shouldShowFirstNineTesters from "./shouldShowFirstNineTesters";

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

describe("GET /users/me/rank/list - Is first", () => {
  const data: any = {};
  beforeAll(async () => {
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
    await profileData.drop();
    await expData.drop();
    await levelData.drop();
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
    await expData.drop();
    await profileData.drop();
    await levelData.drop();
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
    await expData.drop();
    await profileData.drop();
    await levelData.drop();
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
    await expData.drop();
    await profileData.drop();
    await levelData.drop();
    return null;
  });
  it(
    "Should return the first 3 tester, me, and the next 5 testers as peers",
    shouldShowFirstNineTesters(data)
  );
});

describe("GET /users/me/rank/list - Is last", () => {
  const data: any = {};
  beforeAll(async () => {
    data.tester1 = await createTesterData({
      testerId: 9,
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
      testerId: 1,
      name: "Pippo",
      surname: "Pluto",
      exp: 40,
      shortname: "Pippo P.",
      image_name: "pippo+p",
    });
    return null;
  });
  afterAll(async () => {
    await profileData.drop();
    await expData.drop();
    await levelData.drop();
    return null;
  });
  it(
    "Should return the first 8 tester and me as peers",
    shouldShowFirstNineTesters(data)
  );
});

describe("GET /users/me/rank/list - Is second from last", () => {
  const data: any = {};
  beforeAll(async () => {
    data.tester1 = await createTesterData({
      testerId: 8,
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
      testerId: 1,
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
    await expData.drop();
    await profileData.drop();
    await levelData.drop();
    return null;
  });
  it(
    "Should return the first 7 tester, me and the last tester as peers",
    shouldShowFirstNineTesters(data)
  );
});

describe("GET /users/me/rank/list - Is third from last", () => {
  const data: any = {};
  beforeAll(async () => {
    data.tester1 = await createTesterData({
      testerId: 7,
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
      testerId: 1,
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
    await expData.drop();
    await profileData.drop();
    await levelData.drop();
    return null;
  });
  it(
    "Should return the first 6 tester, me and the last 2 tester as peers",
    shouldShowFirstNineTesters(data)
  );
});

describe("GET /users/me/rank/list - Is fourth from last", () => {
  const data: any = {};
  beforeAll(async () => {
    data.tester1 = await createTesterData({
      testerId: 6,
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
      testerId: 1,
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
    await expData.drop();
    await profileData.drop();
    await levelData.drop();
    return null;
  });
  it(
    "Should return the first 5 tester, me and the last 3 tester as peers",
    shouldShowFirstNineTesters(data)
  );
});
