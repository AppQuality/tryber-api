import app from "@src/app";
import Attributions from "@src/__mocks__/mockedDb/attributions";
import { data as PaymentRequest } from "@src/__mocks__/mockedDb/paymentRequest";
import { data as FiscalProfile } from "@src/__mocks__/mockedDb/fiscalProfile";
import Profile from "@src/__mocks__/mockedDb/profile";
import WpOptions from "@src/__mocks__/mockedDb/wp_options";
import request from "supertest";
import { tryber } from "@src/features/database";

describe("GET /users/me - booties data - fiscal_category = 1", () => {
  const data: any = {};
  beforeEach(async () => {
    data.tester = await Profile.insert({
      id: 1,
      wp_user_id: 1,
      pending_booty: 0,
    });
    await Profile.insert({
      id: 2,
      wp_user_id: 2,
      pending_booty: 0,
    });
    await FiscalProfile.validFiscalProfile({
      id: 1,
      tester_id: 1,
      fiscal_category: 1,
    });
    await FiscalProfile.inactiveFiscalProfile({
      id: 2,
      tester_id: 1,
      fiscal_category: 2,
    });
    await FiscalProfile.validFiscalProfile({
      id: 3,
      tester_id: 2,
      fiscal_category: 1,
    });

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
    await PaymentRequest.drop();
    await FiscalProfile.drop();
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
      id: 1,
      wp_user_id: 1,
      pending_booty: 0,
    });
    await Profile.insert({
      id: 2,
      wp_user_id: 2,
      pending_booty: 0,
    });
    await FiscalProfile.validFiscalProfile({
      id: 1,
      tester_id: 1,
      fiscal_category: 2,
    });
    await FiscalProfile.inactiveFiscalProfile({
      id: 2,
      tester_id: 2,
      fiscal_category: 1,
    });
    await FiscalProfile.validFiscalProfile({
      id: 3,
      tester_id: 1,
      fiscal_category: 1,
    });

    await PaymentRequest.paidPaypalPayment({
      id: 1,
      tester_id: 2,
      amount: 100.2,
      amount_gross: 125.25,
      fiscal_profile_id: 1,
    });
    await PaymentRequest.paidPaypalPayment({
      id: 2,
      tester_id: 2,
      amount: 100,
      amount_gross: 125,
      fiscal_profile_id: 1,
    });
    await PaymentRequest.processingPaypalPayment({
      id: 3,
      tester_id: 2,
      amount: 100.2,
      amount_gross: 125.25,
      fiscal_profile_id: 1,
    });
    await PaymentRequest.paidPaypalPayment({
      id: 4,
      tester_id: 1,
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
    await PaymentRequest.drop();
    await FiscalProfile.drop();
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
      value: 125.25,
      currency: "EUR",
    });
    expect(response.body.booty).not.toHaveProperty("net");
  });
});

describe("GET /users/me - pending_booty threshold", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        id: 1,
        wp_user_id: 1,
        pending_booty: 0,
        email: "jhon.doe@unguess.io",
        employment_id: 1,
        education_id: 1,
      },
      {
        id: 2,
        wp_user_id: 2,
        pending_booty: 0,
        email: "jhon.doe@unguess.io",
        employment_id: 1,
        education_id: 1,
      },
    ]);

    await WpOptions.crowdWpOptions();
    await tryber.tables.WpAppqFiscalProfile.do().insert({
      id: 1,
      name: "Fiscal Profile 1",
      surname: "Fiscal Profile Surname",
      sex: "0",
      birth_date: "1990-01-01",
      tester_id: 1,
      fiscal_category: 2,
    });
    await tryber.tables.WpAppqPayment.do().insert([
      {
        id: 1,
        amount: 15,
        tester_id: 1,
        is_requested: 1,
      },
      {
        id: 2,
        amount: 15,
        tester_id: 2,
        is_requested: 0,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await WpOptions.clear();
    await tryber.tables.WpAppqPayment.do().delete();
    await tryber.tables.WpAppqFiscalProfile.do().delete();
  });

  it("Should return booty threshold.isOver=false if pending booty < threshold", async () => {
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
    await tryber.tables.WpAppqPayment.do().insert({
      id: 3,
      amount: 15,
      tester_id: 1,
      is_requested: 0,
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
