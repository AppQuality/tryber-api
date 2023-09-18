import Attributions from "@src/__mocks__/mockedDb/attributions";
import Campaigns from "@src/__mocks__/mockedDb/campaign";
import { data as requestData } from "@src/__mocks__/mockedDb/paymentRequest";
import { data as FiscalProfile } from "@src/__mocks__/mockedDb/fiscalProfile";
import Profile from "@src/__mocks__/mockedDb/profile";
import { data as workTypeData } from "@src/__mocks__/mockedDb/workType";
import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import request from "supertest";

const campaign1 = {
  id: 1,
  title: "Campaign 1",
};
const campaign2 = {
  id: 2,
  title: "Campaign 2",
};
const work_type1 = {
  id: 1,
  work_type: "A - Work type",
};
const work_type2 = {
  id: 2,
  work_type: "Z - Work type",
};

describe("GET /users/me/payments/{payment} fiscal category = 1", () => {
  const data: any = {};
  beforeAll(async () => {
    await Campaigns.insert(campaign1);
    await Campaigns.insert(campaign2);
    await sqlite3.insert("wp_appq_payment_work_types", work_type1);
    await sqlite3.insert("wp_appq_payment_work_types", work_type2);

    await Profile.insert({
      id: 1,
      wp_user_id: 1,
      pending_booty: 100,
    });
    await Profile.insert({
      id: 2,
      wp_user_id: 2,
      pending_booty: 100,
    });
    requestData.processingPaypalPayment({
      id: 1,
      tester_id: 1,
    });
    requestData.processingPaypalPayment({
      id: 2,
      tester_id: 2,
    });
    data.payment1 = await Attributions.insert({
      id: 1,
      amount: 10,
      creation_date: new Date("01/01/1972").toISOString(),
      work_type_id: work_type1.id,
      request_id: 1,
      campaign_id: campaign1.id,
    });

    data.payment2 = await Attributions.insert({
      id: 2,
      amount: 20,
      creation_date: new Date("01/02/1972").toISOString(),
      work_type_id: work_type2.id,
      request_id: 1,
      campaign_id: campaign1.id,
    });
    data.payment3 = await Attributions.insert({
      id: 4,
      amount: 30,
      creation_date: new Date("01/03/1972").toISOString(),
      work_type_id: work_type2.id,
      request_id: 1,
      campaign_id: campaign2.id,
    });

    await Attributions.insert({
      id: 3,
      amount: 40,
      creation_date: new Date("01/03/1972").toISOString(),
      work_type_id: work_type1.id,
      request_id: 2,
      campaign_id: campaign2.id,
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
  });
  afterAll(async () => {
    await Profile.clear();
    await Attributions.clear();
    await requestData.drop();
    await Campaigns.clear();
    await workTypeData.drop();
    await FiscalProfile.drop();
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/users/me/payments/1");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if the tester has the payment", async () => {
    const response = await request(app)
      .get("/users/me/payments/1")
      .set("authorization", "Bearer tester");
    console.log(response.body);
    expect(response.status).toBe(200);
  });
  it("Should answer 404 if the payment is from another tester", async () => {
    const response = await request(app)
      .get("/users/me/payments/2")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(404);
  });
  it("Should answer 404 if the tester doesn't have the payment", async () => {
    const response = await request(app)
      .get("/users/me/payments/100")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(404);
  });
  it("Should be orderable by date", async () => {
    const response = await request(app)
      .get("/users/me/payments/1?orderBy=date")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.map((r: { date: string }) => r.date)).toEqual([
      data.payment3.creation_date.substring(0, 10),
      data.payment2.creation_date.substring(0, 10),
      data.payment1.creation_date.substring(0, 10),
    ]);
    const responseDesc = await request(app)
      .get("/users/me/payments/1?orderBy=date&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(
      responseDesc.body.results.map((r: { date: string }) => r.date)
    ).toEqual([
      data.payment3.creation_date.substring(0, 10),
      data.payment2.creation_date.substring(0, 10),
      data.payment1.creation_date.substring(0, 10),
    ]);
    const responseAsc = await request(app)
      .get("/users/me/payments/1?orderBy=date&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(
      responseAsc.body.results.map((r: { date: string }) => r.date)
    ).toEqual([
      data.payment1.creation_date.substring(0, 10),
      data.payment2.creation_date.substring(0, 10),
      data.payment3.creation_date.substring(0, 10),
    ]);
  });
  it("Should return gross and net for each activities", async () => {
    const response = await request(app)
      .get("/users/me/payments/1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.length).toEqual(3);
    expect(response.body.results[0]).toHaveProperty("amount", {
      net: { value: data.payment3.amount * 0.8, currency: "EUR" },
      gross: { value: data.payment3.amount, currency: "EUR" },
    });
    expect(response.body.results[1]).toHaveProperty("amount", {
      net: { value: data.payment2.amount * 0.8, currency: "EUR" },
      gross: { value: data.payment2.amount, currency: "EUR" },
    });
    expect(response.body.results[2]).toHaveProperty("amount", {
      net: { value: data.payment1.amount * 0.8, currency: "EUR" },
      gross: { value: data.payment1.amount, currency: "EUR" },
    });
  });
  it("Should be orderable by amount DESC as default if is set orderBy=net or orderBy=gross", async () => {
    const orderedByNet = await request(app)
      .get("/users/me/payments/1?orderBy=net")
      .set("authorization", "Bearer tester");
    expect(orderedByNet.status).toBe(200);
    expect(orderedByNet.body.results.map((r: { id: number }) => r.id)).toEqual([
      data.payment3.id,
      data.payment2.id,
      data.payment1.id,
    ]);
    const orderedByGross = await request(app)
      .get("/users/me/payments/1?orderBy=gross")
      .set("authorization", "Bearer tester");
    expect(orderedByGross.status).toBe(200);
    expect(
      orderedByGross.body.results.map((r: { id: number }) => r.id)
    ).toEqual([data.payment3.id, data.payment2.id, data.payment1.id]);
  });
  it("Should be orderable by amount DESC if is set order=desc with orderBy=net or gross", async () => {
    const orderedByNet = await request(app)
      .get("/users/me/payments/1?orderBy=net&order=DESC")
      .set("authorization", "Bearer tester");
    expect(orderedByNet.status).toBe(200);
    expect(orderedByNet.body.results.map((r: { id: number }) => r.id)).toEqual([
      data.payment3.id,
      data.payment2.id,
      data.payment1.id,
    ]);
    const orderedByGross = await request(app)
      .get("/users/me/payments/1?orderBy=gross&order=DESC")
      .set("authorization", "Bearer tester");
    expect(orderedByGross.status).toBe(200);
    expect(
      orderedByGross.body.results.map((r: { id: number }) => r.id)
    ).toEqual([data.payment3.id, data.payment2.id, data.payment1.id]);
  });

  it("Should be orderable by amount ASC if is set order=ASC with orderBy=net or gross", async () => {
    const orderedByNet = await request(app)
      .get("/users/me/payments/1?orderBy=net&order=ASC")
      .set("authorization", "Bearer tester");
    expect(orderedByNet.status).toBe(200);
    expect(orderedByNet.body.results.map((r: { id: number }) => r.id)).toEqual([
      data.payment1.id,
      data.payment2.id,
      data.payment3.id,
    ]);
    const orderedByGross = await request(app)
      .get("/users/me/payments/1?orderBy=gross&order=ASC")
      .set("authorization", "Bearer tester");
    expect(orderedByGross.status).toBe(200);
    expect(
      orderedByGross.body.results.map((r: { id: number }) => r.id)
    ).toEqual([data.payment1.id, data.payment2.id, data.payment3.id]);
  });

  it("Should be orderable by activity name", async () => {
    const response = await request(app)
      .get("/users/me/payments/1?orderBy=activity")
      .set("authorization", "Bearer tester");
    console.log(response.body);
    expect(response.status).toBe(200);
    expect(
      response.body.results.map((r: { activity: string }) => r.activity)
    ).toEqual([
      `[CP-${campaign2.id}] ${campaign2.title}`,
      `[CP-${campaign1.id}] ${campaign1.title}`,
      `[CP-${campaign1.id}] ${campaign1.title}`,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/payments/1?orderBy=activity&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(
      responseDesc.body.results.map((r: { activity: string }) => r.activity)
    ).toEqual([
      `[CP-${campaign2.id}] ${campaign2.title}`,
      `[CP-${campaign1.id}] ${campaign1.title}`,
      `[CP-${campaign1.id}] ${campaign1.title}`,
    ]);
    const responseAsc = await request(app)
      .get("/users/me/payments/1?orderBy=activity&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(
      responseAsc.body.results.map((r: { activity: string }) => r.activity)
    ).toEqual([
      `[CP-${campaign1.id}] ${campaign1.title}`,
      `[CP-${campaign1.id}] ${campaign1.title}`,
      `[CP-${campaign2.id}] ${campaign2.title}`,
    ]);
  });

  it("Should be orderable by activity type", async () => {
    const response = await request(app)
      .get("/users/me/payments/1?orderBy=type")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.map((r: { type: string }) => r.type)).toEqual([
      work_type2.work_type,
      work_type2.work_type,
      work_type1.work_type,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/payments/1?orderBy=type&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(
      responseDesc.body.results.map((r: { type: string }) => r.type)
    ).toEqual([
      work_type2.work_type,
      work_type2.work_type,
      work_type1.work_type,
    ]);
    const responseAsc = await request(app)
      .get("/users/me/payments/1?orderBy=type&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(
      responseAsc.body.results.map((r: { type: string }) => r.type)
    ).toEqual([
      work_type1.work_type,
      work_type2.work_type,
      work_type2.work_type,
    ]);
  });

  it("Should return 2 results if is set limit parameter with limit = 2", async () => {
    const response = await request(app)
      .get("/users/me/payments/1?limit=2")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("limit");
    expect(response.body.limit).toBe(2);
    expect(response.body.results.map((item: any) => item.id)).toEqual([
      data.payment3.id,
      data.payment2.id,
    ]);
    const responseAsc = await request(app)
      .get("/users/me/payments/1?order=ASC&limit=2")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body).toHaveProperty("limit");
    expect(responseAsc.body.limit).toBe(2);
    expect(responseAsc.body.results.map((item: any) => item.id)).toEqual([
      data.payment1.id,
      data.payment2.id,
    ]);
  });
  it("Should skip the first result if is set start=1 parameter", async () => {
    const response = await request(app)
      .get("/users/me/payments/1?start=1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("start");
    expect(response.body.start).toBe(1);
    expect(response.body.results.map((item: any) => item.id)).toEqual([
      data.payment2.id,
      data.payment1.id,
    ]);
    const responseAsc = await request(app)
      .get("/users/me/payments/1?start=1&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body).toHaveProperty("start");
    expect(responseAsc.body.start).toBe(1);
    expect(responseAsc.body.results.map((item: any) => item.id)).toEqual([
      data.payment2.id,
      data.payment3.id,
    ]);
  });

  it("Should return total of records only if limit is set", async () => {
    const response = await request(app)
      .get("/users/me/payments/1?limit=50")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("total");
    const responseNoLimit = await request(app)
      .get("/users/me/payments/1")
      .set("authorization", "Bearer tester");
    expect(responseNoLimit.status).toBe(200);
    expect(responseNoLimit.body).not.toHaveProperty("total");
  });
});

describe("GET /users/me/payments/{payment} fiscal category = 2", () => {
  const data: any = {};
  beforeAll(async () => {
    await Campaigns.insert(campaign1);
    await Campaigns.insert(campaign2);
    await sqlite3.insert("wp_appq_payment_work_types", work_type1);
    await sqlite3.insert("wp_appq_payment_work_types", work_type2);

    await Profile.insert({
      id: 1,
      wp_user_id:1,
      pending_booty: 100,
    });
    await Profile.insert({
      id: 2,
      wp_user_id:2,
      pending_booty: 100,
    });
    requestData.processingPaypalPayment({
      id: 1,
      tester_id: 1,
    });
    requestData.processingPaypalPayment({
      id: 2,
      tester_id: 2,
    });
    data.payment1 = await Attributions.insert({
      id: 1,
      amount: 10,
      creation_date: new Date("01/01/1972").toISOString(),
      work_type_id: work_type1.id,
      request_id: 1,
      campaign_id: campaign1.id,
    });

    data.payment2 = await Attributions.insert({
      id: 2,
      amount: 20,
      creation_date: new Date("01/02/1972").toISOString(),
      work_type_id: work_type2.id,
      request_id: 1,
      campaign_id: campaign1.id,
    });
    data.payment3 = await Attributions.insert({
      id: 4,
      amount: 30,
      creation_date: new Date("01/03/1972").toISOString(),
      work_type_id: work_type2.id,
      request_id: 1,
      campaign_id: campaign2.id,
    });

    await Attributions.insert({
      id: 3,
      amount: 40,
      creation_date: new Date("01/03/1972").toISOString(),
      work_type_id: work_type1.id,
      request_id: 2,
      campaign_id: campaign2.id,
    });

    await FiscalProfile.validFiscalProfile({
      id: 1,
      tester_id: 1,
      fiscal_category: 2,
    });
    await FiscalProfile.validFiscalProfile({
      id: 2,
      tester_id: 2,
      fiscal_category: 2,
    });
  });
  afterAll(async () => {
    await Profile.clear();
    await Attributions.clear();
    await requestData.drop();
    await Campaigns.clear();
    await workTypeData.drop();
    await FiscalProfile.drop();
  });

  it("Should return amount gross for each activities", async () => {
    const response = await request(app)
      .get("/users/me/payments/1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.length).toEqual(3);
    expect(response.body.results[0]).toHaveProperty("amount", {
      gross: { value: data.payment3.amount, currency: "EUR" },
    });
    expect(response.body.results[1]).toHaveProperty("amount", {
      gross: { value: data.payment2.amount, currency: "EUR" },
    });
    expect(response.body.results[2]).toHaveProperty("amount", {
      gross: { value: data.payment1.amount, currency: "EUR" },
    });
  });
  it("Should not return amount net for each activities", async () => {
    const response = await request(app)
      .get("/users/me/payments/1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.length).toEqual(3);
    expect(response.body.results[0]).not.toHaveProperty("net");
    expect(response.body.results[1]).not.toHaveProperty("net");
    expect(response.body.results[2]).not.toHaveProperty("net");
  });
});
