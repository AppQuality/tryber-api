import Attributions, {
  AttributionParams,
} from "@src/__mocks__/mockedDb/attributions";
import Campaigns from "@src/__mocks__/mockedDb/campaign";
import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import request from "supertest";
import { tryber } from "@src/features/database";

const campaign1 = {
  id: 1,
  title: "The Best Campaign ever",
};
const campaign2 = {
  id: 2,
  title: "Absolut Best Campaign ever",
};
const campaign10 = {
  id: 10,
  title: "Absolut Best Campaign ever",
};
const attribution1: AttributionParams = {
  id: 1,
  tester_id: 1,
  campaign_id: 2,
  amount: 6969.69,
  creation_date: "1970-01-01 00:00:00",
  is_paid: 0,
  is_requested: 0,
  work_type_id: 1,
};
const attribution2: AttributionParams = {
  id: 2,
  tester_id: 1,
  campaign_id: 1,
  amount: 90,
  creation_date: "1980-01-01 00:00:00",
  is_paid: 0,
  is_requested: 0,
  work_type_id: 2,
};
const attribution3: AttributionParams = {
  id: 3,
  tester_id: 1,
  campaign_id: 10,
  amount: 99,
  creation_date: "1960-01-01 00:00:00",
  is_paid: 0,
  is_requested: 0,
  work_type_id: 3,
};

const attribution4: AttributionParams = {
  id: 6,
  tester_id: 2,
  campaign_id: 1,
  amount: 9999,
  creation_date: "1960-01-01 00:00:00",
  is_paid: 0,
  is_requested: 0,
  work_type_id: 3,
};
const attributionPaid: AttributionParams = {
  id: 4,
  tester_id: 1,
  campaign_id: 3,
  amount: 100,
  creation_date: "1980-01-01 00:00:00",
  is_paid: 1,
  is_requested: 0,
  work_type_id: 3,
};
const attributionTryber2: AttributionParams = {
  id: 333,
  tester_id: 2,
  campaign_id: 1,
  amount: 169,
  creation_date: "1969-06-09 00:00:00",
  is_paid: 1,
  work_type_id: 3,
};
const attributionRequested: AttributionParams = {
  id: 666,
  tester_id: 1,
  campaign_id: 1,
  amount: 100,
  creation_date: "1980-01-01 00:00:00",
  is_paid: 0,
  is_requested: 1,
  work_type_id: 3,
};

describe("GET /users/me/pending_booty - fiscal_category = 1", () => {
  beforeAll(async () => {
    await Campaigns.insert(campaign1);
    await Campaigns.insert(campaign2);
    await Campaigns.insert(campaign10);
    await sqlite3.insert("wp_appq_payment", attribution1);
    await sqlite3.insert("wp_appq_payment", attribution2);
    await sqlite3.insert("wp_appq_payment", attribution3);
    await sqlite3.insert("wp_appq_payment", attributionPaid);
    await sqlite3.insert("wp_appq_payment", attributionRequested);
    await sqlite3.insert("wp_appq_payment", attribution4);
    await tryber.tables.WpAppqPaymentWorkTypes.do().insert([
      { id: 1, work_type: "B Activity1" },
      { id: 2, work_type: "A Activity2" },
      { id: 3, work_type: "C Activity3" },
    ]);
    await tryber.tables.WpAppqFiscalProfile.do().insert([
      {
        fiscal_category: 1,
        tester_id: 1,
        name: "test1",
        surname: "surname1",
        sex: "1",
        birth_date: "1990-01-01",
      },
    ]);
  });
  afterAll(async () => {
    await Attributions.clear();
    await Campaigns.clear();
    await tryber.tables.WpAppqFiscalProfile.do().delete();
    await tryber.tables.WpAppqPaymentWorkTypes.do().delete();
  });

  it("Should return net and gross if fiscal profile category is 1", async () => {
    const response = await request(app)
      .get("/users/me/pending_booty")
      .set("authorization", "Bearer tester");
    expect(response.body.results).toEqual([
      {
        id: attribution2.id,
        name: `[CP-${campaign1.id}] ${campaign1.title}`,
        amount: {
          net: {
            value:
              attribution2.amount &&
              Number(parseFloat(`${attribution2.amount * 0.8}`).toFixed(2)),
            currency: "EUR",
          },
          gross: {
            value: attribution2.amount,
            currency: "EUR",
          },
        },
        attributionDate: attribution2.creation_date?.substring(0, 10),
        activity: "A Activity2",
      },
      {
        id: attribution1.id,
        name: `[CP-${campaign2.id}] ${campaign2.title}`,
        amount: {
          net: {
            value:
              attribution1.amount &&
              Number(parseFloat(`${attribution1.amount * 0.8}`).toFixed(2)),
            currency: "EUR",
          },
          gross: {
            value: attribution1.amount,
            currency: "EUR",
          },
        },
        attributionDate: attribution1.creation_date?.substring(0, 10),
        activity: "B Activity1",
      },
      {
        id: attribution3.id,
        name: `[CP-${campaign10.id}] ${campaign10.title}`,
        amount: {
          net: {
            value:
              attribution3.amount &&
              Number(parseFloat(`${attribution3.amount * 0.8}`).toFixed(2)),
            currency: "EUR",
          },
          gross: {
            value: attribution3.amount,
            currency: "EUR",
          },
        },
        attributionDate: attribution3.creation_date?.substring(0, 10),
        activity: "C Activity3",
      },
    ]);
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/users/me/pending_booty");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged in", async () => {
    const response = await request(app)
      .get("/users/me/pending_booty")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
  });
  it("Should return a list of attributions", async () => {
    const response = await request(app)
      .get("/users/me/pending_booty")
      .set("authorization", "Bearer tester");
    expect(response.body.results).toEqual([
      {
        id: attribution2.id,
        name: `[CP-${campaign1.id}] ${campaign1.title}`,
        amount: {
          net: {
            value:
              attribution2.amount &&
              Number(parseFloat(`${attribution2.amount * 0.8}`).toFixed(2)),
            currency: "EUR",
          },
          gross: {
            value: attribution2.amount,
            currency: "EUR",
          },
        },
        attributionDate: attribution2.creation_date?.substring(0, 10),
        activity: "A Activity2",
      },
      {
        id: attribution1.id,
        name: `[CP-${campaign2.id}] ${campaign2.title}`,
        amount: {
          net: {
            value:
              attribution1.amount &&
              Number(parseFloat(`${attribution1.amount * 0.8}`).toFixed(2)),
            currency: "EUR",
          },
          gross: {
            value: attribution1.amount,
            currency: "EUR",
          },
        },
        attributionDate: attribution1.creation_date?.substring(0, 10),
        activity: "B Activity1",
      },
      {
        id: attribution3.id,
        name: `[CP-${campaign10.id}] ${campaign10.title}`,
        amount: {
          net: {
            value:
              attribution3.amount &&
              Number(parseFloat(`${attribution3.amount * 0.8}`).toFixed(2)),
            currency: "EUR",
          },
          gross: {
            value: attribution3.amount,
            currency: "EUR",
          },
        },
        attributionDate: attribution3.creation_date?.substring(0, 10),
        activity: "C Activity3",
      },
    ]);
  });
  it("Should return attributions not paid and not requested", async () => {
    const response = await request(app)
      .get("/users/me/pending_booty")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.map((el: { id: number }) => el.id)).toEqual(
      expect.not.arrayContaining([attributionRequested.id])
    );
    expect(response.body.results.map((el: { id: number }) => el.id)).toEqual(
      expect.not.arrayContaining([attributionPaid.id])
    );
  });
  it("Should return only tryber1 attributions", async () => {
    const response = await request(app)
      .get("/users/me/pending_booty")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.map((el: { id: number }) => el.id)).toEqual(
      expect.not.arrayContaining([attributionTryber2.id])
    );
  });
  it("Should return requests ordered ASC DESC if order is set", async () => {
    const responseAsc = await request(app)
      .get("/users/me/pending_booty?order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.results.map((item: any) => item.id)).toEqual([
      3, 1, 2,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/pending_booty?order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.results.map((item: any) => item.id)).toEqual([
      2, 1, 3,
    ]);
  });
  it("Should return attributions ordered by attributionDate if orderBy=attributionDate is set", async () => {
    const responseAsc = await request(app)
      .get("/users/me/pending_booty?orderBy=attributionDate&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.results.map((item: any) => item.id)).toEqual([
      3, 1, 2,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/pending_booty?orderBy=attributionDate&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.results.map((item: any) => item.id)).toEqual([
      2, 1, 3,
    ]);
  });
  it("Should return attributions ordered by id if orderBy=id is set", async () => {
    const response = await request(app)
      .get("/users/me/pending_booty?orderBy=id")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.map((item: any) => item.id)).toEqual([
      3, 2, 1,
    ]);
    const responseAsc = await request(app)
      .get("/users/me/pending_booty?orderBy=id&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.results.map((item: any) => item.id)).toEqual([
      1, 2, 3,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/pending_booty?orderBy=id&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.results.map((item: any) => item.id)).toEqual([
      3, 2, 1,
    ]);
  });
  it("Should return attributions ordered by gross if orderBy=gross is set", async () => {
    const response = await request(app)
      .get("/users/me/pending_booty?orderBy=gross")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.map((item: any) => item.id)).toEqual([
      1, 3, 2,
    ]);
    const responseAsc = await request(app)
      .get("/users/me/pending_booty?orderBy=gross&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.results.map((item: any) => item.id)).toEqual([
      2, 3, 1,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/pending_booty?orderBy=gross&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.results.map((item: any) => item.id)).toEqual([
      1, 3, 2,
    ]);
  });
  it("Should return attributions ordered by net if orderBy=net is set", async () => {
    const response = await request(app)
      .get("/users/me/pending_booty?orderBy=net")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.map((item: any) => item.id)).toEqual([
      1, 3, 2,
    ]);
    const responseAsc = await request(app)
      .get("/users/me/pending_booty?orderBy=net&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.results.map((item: any) => item.id)).toEqual([
      2, 3, 1,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/pending_booty?orderBy=net&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.results.map((item: any) => item.id)).toEqual([
      1, 3, 2,
    ]);
  });
  it("Should return attributions ordered by activityName if orderBy=activityName is set", async () => {
    const response = await request(app)
      .get("/users/me/pending_booty?orderBy=activityName")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.map((item: any) => item.id)).toEqual([
      3, 1, 2,
    ]);
    const responseAsc = await request(app)
      .get("/users/me/pending_booty?orderBy=activityName&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.results.map((item: any) => item.id)).toEqual([
      2, 1, 3,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/pending_booty?orderBy=activityName&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.results.map((item: any) => item.id)).toEqual([
      3, 1, 2,
    ]);
  });
  it("Should return attributions ordered by activity if orderBy=activity is set", async () => {
    const response = await request(app)
      .get("/users/me/pending_booty?orderBy=activity")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.map((item: any) => item.id)).toEqual([
      3, 1, 2,
    ]);
    const responseAsc = await request(app)
      .get("/users/me/pending_booty?orderBy=activity&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.results.map((item: any) => item.id)).toEqual([
      2, 1, 3,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/pending_booty?orderBy=activity&order=DESC")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.results.map((item: any) => item.id)).toEqual([
      3, 1, 2,
    ]);
  });
  it("Should return attributions ordered by attributionDate DESC by default", async () => {
    const responseDefault = await request(app)
      .get("/users/me/pending_booty")
      .set("authorization", "Bearer tester");
    expect(responseDefault.status).toBe(200);
    expect(responseDefault.body.results.map((item: any) => item.id)).toEqual([
      2, 1, 3,
    ]);
    const respOrderedByAttrDate = await request(app)
      .get("/users/me/pending_booty?orderBy=attributionDate")
      .set("authorization", "Bearer tester");
    expect(respOrderedByAttrDate.status).toBe(200);
    expect(
      respOrderedByAttrDate.body.results.map((item: any) => item.id)
    ).toEqual([2, 1, 3]);
    expect(responseDefault.body).toEqual(respOrderedByAttrDate.body);
  });
  it("Should return 3 results if is set limit parameter with limit = 2", async () => {
    const response = await request(app)
      .get("/users/me/pending_booty?limit=2")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("limit");
    expect(response.body.limit).toBe(2);
    expect(response.body.results.map((item: any) => item.id)).toEqual([2, 1]);

    const responseASC = await request(app)
      .get("/users/me/pending_booty?limit=2&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseASC.status).toBe(200);
    expect(responseASC.body).toHaveProperty("limit");
    expect(responseASC.body.results.map((item: any) => item.id)).toEqual([
      3, 1,
    ]);
  });

  it("Should skip the first result if is set start=1 parameter", async () => {
    const response = await request(app)
      .get("/users/me/pending_booty?start=1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("start");
    expect(response.body.start).toBe(1);
    expect(response.body.results.map((item: any) => item.id)).toEqual([1, 3]);

    const responseASC = await request(app)
      .get("/users/me/pending_booty?start=1&order=ASC")
      .set("authorization", "Bearer tester");
    expect(responseASC.status).toBe(200);
    expect(responseASC.body).toHaveProperty("start");
    expect(responseASC.body.results.map((item: any) => item.id)).toEqual([
      1, 2,
    ]);
  });

  it("Should return the size that is equal to number of results", async () => {
    const response = await request(app)
      .get("/users/me/pending_booty")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.size).toBe(response.body.results.length);
    const responseStart = await request(app)
      .get("/users/me/pending_booty?start=2&limit=2")
      .set("authorization", "Bearer tester");
    expect(responseStart.status).toBe(200);
    expect(responseStart.body.size).toBe(responseStart.body.results.length);
  });

  it("Should return the size of limit", async () => {
    const response = await request(app)
      .get("/users/me/pending_booty?limit=50")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.limit).toBe(50);
    expect(response.body).toHaveProperty("limit");
    const responseNoLimit = await request(app)
      .get("/users/me/pending_booty")
      .set("authorization", "Bearer tester");
    expect(responseNoLimit.status).toBe(200);
    expect(responseNoLimit.body).toHaveProperty("limit");
    expect(responseNoLimit.body.limit).toBe(25);
  });

  it("Should return total of records only if limit is set", async () => {
    const response = await request(app)
      .get("/users/me/pending_booty?limit=50")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("total");
    const responseNoLimit = await request(app)
      .get("/users/me/pending_booty")
      .set("authorization", "Bearer tester");
    expect(responseNoLimit.status).toBe(200);
    expect(responseNoLimit.body).not.toHaveProperty("total");
  });

  it("Should return size and start", async () => {
    const response = await request(app)
      .get("/users/me/pending_booty")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("size");
    expect(response.body.size).toBe(3);
    expect(response.body).toHaveProperty("start");
    expect(response.body.start).toBe(0);
  });
});

describe("Route GET payment-pending-booty when no data", () => {
  it("Should return 404", async () => {
    const response = await request(app)
      .get("/users/me/pending_booty")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      element: "pending booty",
      id: 1,
      message: "No booty until now",
    });
  });
});

describe("GET /users/me/pending_booty - fiscal_category = 2", () => {
  beforeAll(async () => {
    await Campaigns.insert(campaign1);
    await Campaigns.insert(campaign2);
    await Campaigns.insert(campaign10);
    await sqlite3.insert("wp_appq_payment", attribution1);
    await sqlite3.insert("wp_appq_payment", attribution2);
    await sqlite3.insert("wp_appq_payment", attribution3);
    await sqlite3.insert("wp_appq_payment", attribution4);
    await sqlite3.insert("wp_appq_payment", attributionPaid);
    await sqlite3.insert("wp_appq_payment", attributionRequested);
    await tryber.tables.WpAppqPaymentWorkTypes.do().insert([
      { id: 1, work_type: "Activity1" },
      { id: 2, work_type: "Activity2" },
      { id: 3, work_type: "Activity3" },
    ]);
    await tryber.tables.WpAppqFiscalProfile.do().insert([
      {
        fiscal_category: 1,
        tester_id: 2,
        name: "test1",
        surname: "surname1",
        sex: "1",
        birth_date: "1990-01-01",
      },
      {
        fiscal_category: 2,
        tester_id: 1,
        name: "test2",
        surname: "surname2",
        sex: "0",
        birth_date: "1990-01-01",
      },
    ]);
  });
  afterAll(async () => {
    await Attributions.clear();
    await Campaigns.clear();
    await tryber.tables.WpAppqFiscalProfile.do().delete();
    await tryber.tables.WpAppqPayment.do().delete();
    await tryber.tables.WpAppqPaymentWorkTypes.do().delete();
  });

  it("Should return only gross if fiscal category id is NOT 1", async () => {
    const response = await request(app)
      .get("/users/me/pending_booty")
      .set("authorization", "Bearer tester");
    expect(response.body.results[0].amount).not.toHaveProperty("net");
    expect(response.body.results[1].amount).not.toHaveProperty("net");
    expect(response.body.results[2].amount).not.toHaveProperty("net");
    expect(response.body.results[0].amount).toHaveProperty("gross");
    expect(response.body.results[1].amount).toHaveProperty("gross");
    expect(response.body.results[2].amount).toHaveProperty("gross");
  });

  it("Should return a list of attributions", async () => {
    const response = await request(app)
      .get("/users/me/pending_booty")
      .set("authorization", "Bearer tester");
    expect(response.body.results).toEqual([
      {
        id: attribution2.id,
        name: `[CP-${campaign1.id}] ${campaign1.title}`,
        amount: {
          gross: {
            value: attribution2.amount,
            currency: "EUR",
          },
        },
        attributionDate: attribution2.creation_date?.substring(0, 10),
        activity: "Activity2",
      },
      {
        id: attribution1.id,
        name: `[CP-${campaign2.id}] ${campaign2.title}`,
        amount: {
          gross: {
            value: attribution1.amount,
            currency: "EUR",
          },
        },
        attributionDate: attribution1.creation_date?.substring(0, 10),
        activity: "Activity1",
      },
      {
        id: attribution3.id,
        name: `[CP-${campaign10.id}] ${campaign10.title}`,
        amount: {
          gross: {
            value: attribution3.amount,
            currency: "EUR",
          },
        },
        attributionDate: attribution3.creation_date?.substring(0, 10),
        activity: "Activity3",
      },
    ]);
  });
  it("Should return attributions not paid and not requested", async () => {
    const response = await request(app)
      .get("/users/me/pending_booty")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.map((el: { id: number }) => el.id)).toEqual(
      expect.not.arrayContaining([attributionRequested.id])
    );
    expect(response.body.results.map((el: { id: number }) => el.id)).toEqual(
      expect.not.arrayContaining([attributionPaid.id])
    );
  });
  it("Should return only tryber1 attributions", async () => {
    const response = await request(app)
      .get("/users/me/pending_booty")
      .set("authorization", "Bearer tester");

    expect(response.status).toBe(200);
    expect(response.body.results.map((el: { id: number }) => el.id)).toEqual(
      expect.not.arrayContaining([attributionTryber2.id])
    );
  });
});
