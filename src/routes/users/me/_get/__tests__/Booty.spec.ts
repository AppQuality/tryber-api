import app from "@src/app";
import Attributions from "@src/__mocks__/mockedDb/attributions";
import Profile from "@src/__mocks__/mockedDb/profile";
import WpOptions from "@src/__mocks__/mockedDb/wp_options";
import { data as wpUsersData } from "@src/__mocks__/mockedDb/wp_users";
import request from "supertest";

describe("GET /users/me - booty data", () => {
  const data: any = {};
  beforeEach(async () => {
    data.tester = await Profile.insert({
      pending_booty: 0,
    });
    await wpUsersData.basicUser({
      ID: data.tester.wp_user_id,
    });
    data.attributionTotal = 0;
    data.attributionTotal += (
      await Attributions.insert({
        id: 1,
        amount: 15,
        tester_id: data.tester.id,
      })
    ).amount;
    data.attributionTotal += (
      await Attributions.insert({
        id: 2,
        amount: 14.99,
        tester_id: data.tester.id,
      })
    ).amount;
    data.attributionTotal += (
      await Attributions.insert({
        id: 3,
        amount: 7.15,
        tester_id: data.tester.id,
      })
    ).amount;

    await Attributions.insert({
      id: 4,
      amount: 50,
      tester_id: data.tester.id,
      is_requested: 1,
    });

    await Attributions.insert({
      id: 5,
      amount: 50,
      tester_id: data.tester.id + 1,
    });
  });
  afterEach(async () => {
    return new Promise(async (resolve) => {
      await Profile.clear();
      await Attributions.clear();
      await wpUsersData.drop();
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
    data.tester = await Profile.insert();
    await wpUsersData.basicUser({
      ID: data.tester.wp_user_id,
    });
    await WpOptions.crowdWpOptions();
  });
  afterEach(async () => {
    await Profile.clear();
    await wpUsersData.drop();
    await WpOptions.clear();
    await Attributions.clear();
  });
  it("Should return booty threshold.isOver=false if pending booty < threshold", async () => {
    await Attributions.insert({
      id: 1,
      amount: 15,
      tester_id: data.tester.id,
      is_requested: 1,
    });

    await Attributions.insert({
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
    await Attributions.insert({
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
