import {
  data as attributionsData,
  table as attributionsTable,
} from "@src/__mocks__/mockedDb/attributions";
import {
  data as profileData,
  table as profileTable,
} from "@src/__mocks__/mockedDb/profile";
import {
  data as wpOptionsData,
  table as wpOptionsTable,
} from "@src/__mocks__/mockedDb/wp_options";
import {
  data as wpUsersData,
  table as wpUsersTable,
} from "@src/__mocks__/mockedDb/wp_users";
import app from "@src/app";
import request from "supertest";

jest.mock("@src/features/db");
jest.mock("@appquality/wp-auth");

describe("GET /users/me - booty data", () => {
  const data: any = {};
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await profileTable.create();
      await wpUsersTable.create();
      data.tester = await profileData.testerWithoutBooty();
      await wpUsersData.basicUser({
        ID: data.tester.wp_user_id,
      });
      await attributionsTable.create();
      data.attributionTotal = 0;
      data.attributionTotal += (
        await attributionsData.validAttribution({
          id: 1,
          amount: 15,
          tester_id: data.tester.id,
        })
      ).amount;
      data.attributionTotal += (
        await attributionsData.validAttribution({
          id: 2,
          amount: 14.99,
          tester_id: data.tester.id,
        })
      ).amount;
      data.attributionTotal += (
        await attributionsData.validAttribution({
          id: 3,
          amount: 7.15,
          tester_id: data.tester.id,
        })
      ).amount;

      await attributionsData.validAttribution({
        id: 4,
        amount: 50,
        tester_id: data.tester.id,
        is_requested: 1,
      });

      await attributionsData.validAttribution({
        id: 5,
        amount: 50,
        tester_id: data.tester.id + 1,
      });

      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await profileTable.drop();
      await attributionsTable.drop();
      await wpUsersTable.drop();
      resolve(null);
    });
  });

  it("Should return total of unrequested attributions if parameter fields=pending_booty", async () => {
    const response = await request(app)
      .get("/users/me?fields=pending_booty")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("pending_booty");
    expect(response.body).toHaveProperty("role");
    expect(response.body.pending_booty).toBe(data.attributionTotal);
  });
});

describe("GET /users/me - pending_booty threshold", () => {
  const data: any = {};
  beforeEach(async () => {
    return new Promise(async (resolve) => {
      await profileTable.create();
      await wpUsersTable.create();
      await attributionsTable.create();
      await wpOptionsTable.create();

      data.tester = await profileData.testerWithoutBooty();
      await wpUsersData.basicUser({
        ID: data.tester.wp_user_id,
      });
      await wpOptionsData.crowdWpOptions();
      resolve(null);
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await profileTable.drop();
      await wpUsersTable.drop();
      await attributionsTable.drop();
      await wpOptionsTable.drop();

      resolve(null);
    });
  });
  it("Should return booty threshold.isOver=false if pending booty < threshold", async () => {
    await attributionsData.validAttribution({
      id: 1,
      amount: 15,
      tester_id: data.tester.id,
      is_requested: 1,
    });

    await attributionsData.validAttribution({
      id: 2,
      amount: 15,
      tester_id: data.tester.id + 1,
    });
    const response = await request(app)
      .get("/users/me?fields=booty_threshold")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("booty_threshold");
    expect(response.body.booty_threshold).toEqual({
      value: 2,
      isOver: false,
    });
  });
  it("Should return booty threshold.isOver=true if pending booty > threshold", async () => {
    await attributionsData.validAttribution({
      id: 1,
      amount: 15,
      tester_id: data.tester.id,
    });
    const response = await request(app)
      .get("/users/me?fields=booty_threshold")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("booty_threshold");
    expect(response.body.booty_threshold).toEqual({
      value: 2,
      isOver: true,
    });
  });
});
