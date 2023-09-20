import app from "@src/app";
import Attributions from "@src/__mocks__/mockedDb/attributions";
import { data as PaymentRequest } from "@src/__mocks__/mockedDb/paymentRequest";
import Profile from "@src/__mocks__/mockedDb/profile";
import WpOptions from "@src/__mocks__/mockedDb/wp_options";
import WpUsers from "@src/__mocks__/mockedDb/wp_users";
import request from "supertest";
import { tryber } from "@src/features/database";

const fiscalProfile = {
  name: "tester1",
  surname: "tester1",
  sex: "0",
  birth_date: "1990-01-01",
};
describe("GET /users/me - booties data - fiscal_category = 1", () => {
  const data: any = {};
  beforeEach(async () => {
    data.tester = await Profile.insert({
      id: 1,
      wp_user_id: 1,
      pending_booty: 0,
    });
    await WpUsers.insert({
      ID: 1,
    });
    await tryber.tables.WpAppqFiscalProfile.do().insert([
      { ...fiscalProfile, tester_id: 1, fiscal_category: 1, is_active: 1 },
      { ...fiscalProfile, tester_id: 1, fiscal_category: 2, is_active: 0 },
      { ...fiscalProfile, tester_id: 2, fiscal_category: 1, is_active: 1 },
    ]);
    await PaymentRequest.paidPaypalPayment({
      id: 1,
      tester_id: 1,
      amount: 100.2,
      amount_gross: 125.25,
      fiscal_profile_id: 1,
    });
    await PaymentRequest.paidPaypalPayment({
      id: 2,
      tester_id: 1,
      amount: 100,
      amount_gross: 125,
      fiscal_profile_id: 1,
    });
    await PaymentRequest.processingPaypalPayment({
      id: 3,
      tester_id: 1,
      amount: 100.2,
      amount_gross: 125.25,
      fiscal_profile_id: 1,
    });
    await PaymentRequest.paidPaypalPayment({
      id: 4,
      tester_id: 2,
      amount: 100.2,
      amount_gross: 125.25,
      fiscal_profile_id: 1,
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
    await Profile.clear();
    await Attributions.clear();
    await WpUsers.clear();
    await PaymentRequest.drop();
    await tryber.tables.WpAppqFiscalProfile.do().delete();
  });

  it("Should return total of unrequested attributions if parameter fields=pending_booty", async () => {
    const response = await request(app)
      .get("/users/me?fields=pending_booty")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("pending_booty");
    expect(response.body).toHaveProperty("role");
    expect(response.body.pending_booty).toHaveProperty("gross", {
      value: data.attributionTotal,
      currency: "EUR",
    });
    expect(response.body.pending_booty).toHaveProperty("net", {
      value: Number((data.attributionTotal * 0.8).toPrecision(4)),
      currency: "EUR",
    });
  });
  it("Should return total of requested attributions if parameter fields=booty", async () => {
    const response = await request(app)
      .get("/users/me?fields=booty")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("booty");
    expect(response.body).toHaveProperty("role");
    expect(response.body.booty).toHaveProperty("gross", {
      value: 250.25,
      currency: "EUR",
    });
    expect(response.body.booty).toHaveProperty("net", {
      value: 200.2,
      currency: "EUR",
    });
  });
});

describe("GET /users/me - booties data - fiscal_category = 2", () => {
  const data: any = {};
  beforeEach(async () => {
    data.tester = await Profile.insert({
      pending_booty: 0,
    });
    await WpUsers.insert({
      ID: data.tester.wp_user_id,
    });
    await tryber.tables.WpAppqFiscalProfile.do().insert([
      { ...fiscalProfile, tester_id: 1, fiscal_category: 2, is_active: 1 },
      { ...fiscalProfile, tester_id: 1, fiscal_category: 1, is_active: 0 },
      { ...fiscalProfile, tester_id: 2, fiscal_category: 1, is_active: 1 },
    ]);
    await PaymentRequest.paidPaypalPayment({
      id: 1,
      tester_id: 1,
      amount: 100.2,
      amount_gross: 125.25,
      fiscal_profile_id: 1,
    });
    await PaymentRequest.paidPaypalPayment({
      id: 2,
      tester_id: 1,
      amount: 100,
      amount_gross: 125,
      fiscal_profile_id: 1,
    });
    await PaymentRequest.processingPaypalPayment({
      id: 3,
      tester_id: 1,
      amount: 100.2,
      amount_gross: 125.25,
      fiscal_profile_id: 1,
    });
    await PaymentRequest.paidPaypalPayment({
      id: 4,
      tester_id: 2,
      amount: 100.2,
      amount_gross: 125.25,
      fiscal_profile_id: 1,
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
    await Profile.clear();
    await Attributions.clear();
    await WpUsers.clear();
    await PaymentRequest.drop();
    await tryber.tables.WpAppqFiscalProfile.do().delete();
  });

  it("Should return total of unrequested attributions if parameter fields=pending_booty", async () => {
    const response = await request(app)
      .get("/users/me?fields=pending_booty")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("pending_booty");
    expect(response.body).toHaveProperty("role");
    expect(response.body.pending_booty).toHaveProperty("gross", {
      value: data.attributionTotal,
      currency: "EUR",
    });
    expect(response.body.pending_booty).not.toHaveProperty("net");
  });
  it("Should return total of requested attributions if parameter fields=booty", async () => {
    const response = await request(app)
      .get("/users/me?fields=booty")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("booty");
    expect(response.body).toHaveProperty("role");
    expect(response.body.booty).toHaveProperty("gross", {
      value: 250.25,
      currency: "EUR",
    });
    expect(response.body.booty).not.toHaveProperty("net");
  });
});

describe("GET /users/me - pending_booty threshold", () => {
  const data: any = {};
  beforeEach(async () => {
    data.tester = await Profile.insert();
    await WpUsers.insert({
      ID: data.tester.wp_user_id,
    });
    await WpOptions.crowdWpOptions();
  });
  afterEach(async () => {
    await Profile.clear();
    await WpUsers.clear();
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
