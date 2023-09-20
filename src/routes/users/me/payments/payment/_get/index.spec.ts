import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import Attributions from "@src/__mocks__/mockedDb/attributions";
import Campaigns from "@src/__mocks__/mockedDb/campaign";
import { data as requestData } from "@src/__mocks__/mockedDb/paymentRequest";
import Profile from "@src/__mocks__/mockedDb/profile";
import { data as workTypeData } from "@src/__mocks__/mockedDb/workType";
import request from "supertest";
import { tryber } from "@src/features/database";

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

describe("GET /users/me/payments/{payment}", () => {
  const data: any = {};
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      await Campaigns.insert(campaign1);
      await Campaigns.insert(campaign2);
      await sqlite3.insert("wp_appq_payment_work_types", work_type1);
      await sqlite3.insert("wp_appq_payment_work_types", work_type2);

      await Profile.insert({
        id: 1,
        pending_booty: 100,
      });
      await Profile.insert({
        id: 2,
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

      await tryber.tables.WpAppqFiscalProfile.do().insert([
        {
          tester_id: 1,
          fiscal_category: 1,
          name: "John",
          surname: "Doe",
          sex: "1",
          birth_date: "1972-01-01",
        },
        {
          tester_id: 2,
          fiscal_category: 2,
          name: "Jane",
          surname: "Doe",
          sex: "0",
          birth_date: "1972-01-01",
        },
      ]);
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      await Profile.clear();
      await Attributions.clear();
      await requestData.drop();
      await Campaigns.clear();
      await workTypeData.drop();
      await tryber.tables.WpAppqFiscalProfile.do().delete();
      resolve(null);
    });
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/users/me/payments/1");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if the tester has the payment", async () => {
    const response = await request(app)
      .get("/users/me/payments/1")
      .set("authorization", "Bearer tester");
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
  it("Should return a list of attributions ordered by date DESC", async () => {
    const response = await request(app)
      .get("/users/me/payments/1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results).toEqual([
      {
        id: data.payment3.id,
        activity: `[CP-${campaign2.id}] ${campaign2.title}`,
        type: work_type2.work_type,
        amount: { value: data.payment3.amount, currency: "EUR" },
        date: data.payment3.creation_date.substring(0, 10),
      },
      {
        id: data.payment2.id,
        activity: `[CP-${campaign1.id}] ${campaign1.title}`,
        type: work_type2.work_type,
        amount: { value: data.payment2.amount, currency: "EUR" },
        date: data.payment2.creation_date.substring(0, 10),
      },
      {
        id: data.payment1.id,
        activity: `[CP-${campaign1.id}] ${campaign1.title}`,
        type: work_type1.work_type,
        amount: { value: data.payment1.amount, currency: "EUR" },
        date: data.payment1.creation_date.substring(0, 10),
      },
    ]);
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
  //
  it("Should be orderable by amount net", async () => {
    const response = await request(app)
      .get("/users/me/payments/1?orderBy=net")
      .set("authorization", "Bearer tester");
    console.log(response.body.results, "suca");
    expect(response.status).toBe(200);
    expect(
      response.body.results.map(
        (r: {
          amount: {
            net: {
              value: number;
              currency: string;
            };
            gross: {
              value: number;
              currency: string;
            };
          };
        }) => r.amount.net.value
      )
    ).toEqual([
      data.payment3.amount.net.value,
      data.payment2.amount.net.value,
      data.payment1.amount.net.value,
    ]);
  });
  it("Should be orderable by amount net ASC", async () => {
    const responseDesc = await request(app)
      .get("/users/me/payments/1?orderBy=amount&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(
      responseDesc.body.results.map(
        (r: { amount: { value: number } }) => r.amount.value
      )
    ).toEqual([
      data.payment3.amount,
      data.payment2.amount,
      data.payment1.amount,
    ]);
  });

  it("Should be orderable by amount net", async () => {
    const responseAsc = await request(app)
      .get("/users/me/payments/1?orderBy=amount&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(
      responseAsc.body.results.map(
        (r: { amount: { value: number } }) => r.amount.value
      )
    ).toEqual([
      data.payment1.amount,
      data.payment2.amount,
      data.payment3.amount,
    ]);
  });

  it("Should be orderable by activity name", async () => {
    const response = await request(app)
      .get("/users/me/payments/1?orderBy=activity")
      .set("authorization", "Bearer tester");
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
