import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const basicPutData: StoplightOperations["post-agreements"]["requestBody"]["content"]["application/json"] =
  {
    title: "Agreement",
    tokens: 10,
    unitPrice: 1,
    startDate: "2020-01-01",
    expirationDate: "2020-01-01",
    customerId: 1,
  };
describe("PUT /agreements/{agreementId}", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqCustomer.do().insert([
      {
        id: 1,
        company: "Company",
        pm_id: 1,
      },
      {
        id: 2,
        company: "Other Company",
        pm_id: 1,
      },
    ]);
  });
  beforeEach(async () => {
    await tryber.tables.FinanceAgreements.do().insert([
      {
        id: 1,
        customer_id: 1,
        title: "Agreement",
        tokens: 10,
        token_unit_price: 1,
        agreement_date: "2020-01-01",
        agreement_close_date: "2020-01-01",
        additional_note: "",
        last_editor_id: 999,
      },
    ]);
  });
  afterEach(async () => {
    await tryber.tables.FinanceAgreements.do().delete();
  });

  it("Should return 403 if not logged in", async () => {
    const response = await request(app).put("/agreements/1").send(basicPutData);
    expect(response.status).toBe(403);
  });

  it("Should return 403 if logged in as tester", async () => {
    const response = await request(app)
      .put("/agreements/1")
      .send(basicPutData)
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should return 403 if logged in as user with single campaign olp", async () => {
    const response = await request(app)
      .put("/agreements/1")
      .send(basicPutData)
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,2]}');
    expect(response.status).toBe(403);
  });
  it("Should return 200 if logged in as user with full access to campaign", async () => {
    const response = await request(app)
      .put("/agreements/1")
      .send(basicPutData)
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
  });

  it("Should return 403 if agreement does not exists", async () => {
    const response = await request(app)
      .put("/agreements/9999")
      .send(basicPutData)
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(403);
  });

  it("Should update agreement title on success", async () => {
    const response = await request(app)
      .put("/agreements/1")
      .send({ ...basicPutData, title: "Agreement new title" })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    console.log(response.body);
    const agreementsAfter = await tryber.tables.FinanceAgreements.do()
      .select()
      .where({ id: 1 })
      .first();
    expect(agreementsAfter?.title).toBe("Agreement new title");
  });

  it("Should return updated agreement title on success", async () => {
    const response = await request(app)
      .put("/agreements/1")
      .send({ ...basicPutData, title: "Agreement new title" })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.title).toBe("Agreement new title");
  });

  it("Should update agreement tokens on success", async () => {
    const response = await request(app)
      .put("/agreements/1")
      .send({ ...basicPutData, tokens: 20 })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    const agreementsAfter = await tryber.tables.FinanceAgreements.do()
      .select()
      .where({ id: 1 })
      .first();
    expect(agreementsAfter?.tokens).toBe(20);
  });

  it("Should return updated agreement tokens on success", async () => {
    const response = await request(app)
      .put("/agreements/1")
      .send({ ...basicPutData, tokens: 20 })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.tokens).toBe(20);
  });

  it("Should update agreement token unit price on success", async () => {
    const response = await request(app)
      .put("/agreements/1")
      .send({ ...basicPutData, unitPrice: 200 })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    const agreementsAfter = await tryber.tables.FinanceAgreements.do()
      .select()
      .where({ id: 1 })
      .first();
    expect(agreementsAfter?.token_unit_price).toBe(200);
  });

  it("Should return updated agreement token unit price on success", async () => {
    const response = await request(app)
      .put("/agreements/1")
      .send({ ...basicPutData, unitPrice: 200 })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.unitPrice).toBe(200);
  });

  it("Should update agreement start date on success", async () => {
    const response = await request(app)
      .put("/agreements/1")
      .send({ ...basicPutData, startDate: "1920-01-01" })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    const agreementsAfter = await tryber.tables.FinanceAgreements.do()
      .select()
      .where({ id: 1 })
      .first();
    expect(agreementsAfter?.agreement_date).toBe("1920-01-01");
  });

  it("Should return updated agreement start date on success", async () => {
    const response = await request(app)
      .put("/agreements/1")
      .send({ ...basicPutData, startDate: "1920-01-01" })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.startDate).toBe("1920-01-01");
  });

  it("Should update agreement end date on success", async () => {
    const response = await request(app)
      .put("/agreements/1")
      .send({ ...basicPutData, expirationDate: "1920-01-01" })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    const agreementsAfter = await tryber.tables.FinanceAgreements.do()
      .select()
      .where({ id: 1 })
      .first();
    expect(agreementsAfter?.agreement_close_date).toBe("1920-01-01");
  });

  it("Should return updated agreement end start date on success", async () => {
    const response = await request(app)
      .put("/agreements/1")
      .send({ ...basicPutData, expirationDate: "1920-01-01" })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.expirationDate).toBe("1920-01-01");
  });

  it("Should update agreement notes on success", async () => {
    const response = await request(app)
      .put("/agreements/1")
      .send({ ...basicPutData, note: "new test note" })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    const agreementsAfter = await tryber.tables.FinanceAgreements.do()
      .select()
      .where({ id: 1 })
      .first();
    expect(agreementsAfter?.additional_note).toBe("new test note");
  });

  it("Should return updated agreement notes on success", async () => {
    const response = await request(app)
      .put("/agreements/1")
      .send({ ...basicPutData, note: "new test note" })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.note).toBe("new test note");
  });

  it("Should update agreement tokenbased status on success", async () => {
    const response = await request(app)
      .put("/agreements/1")
      .send({ ...basicPutData, isTokenBased: true })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    const agreementsAfter = await tryber.tables.FinanceAgreements.do()
      .select()
      .where({ id: 1 })
      .first();
    expect(agreementsAfter?.is_token_based).toBe(1);
  });

  it("Should return updated agreement tokenbased status on success", async () => {
    const response = await request(app)
      .put("/agreements/1")
      .send({ ...basicPutData, isTokenBased: true })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.isTokenBased).toBe(true);
  });

  it("Should return 403 if the customer to be updated does not exists", async () => {
    const response = await request(app)
      .put("/agreements/1")
      .send({ ...basicPutData, customerId: 999 })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(403);
  });

  it("Should update agreement customer on success", async () => {
    const response = await request(app)
      .put("/agreements/1")
      .send({ ...basicPutData, customerId: 2 })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    const agreementsAfter = await tryber.tables.FinanceAgreements.do()
      .select()
      .where({ id: 1 })
      .first();
    expect(agreementsAfter?.customer_id).toBe(2);
  });

  it("Should return updated agreement customer on success", async () => {
    const response = await request(app)
      .put("/agreements/1")
      .send({ ...basicPutData, customerId: 2 })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body.customer).toEqual({
      id: 2,
      company: "Other Company",
    });
  });

  it("Should update last editor id on success", async () => {
    const response = await request(app)
      .put("/agreements/1")
      .send(basicPutData)
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    const agreementsAfter = await tryber.tables.FinanceAgreements.do()
      .select()
      .where({ id: 1 })
      .first();
    expect(agreementsAfter?.last_editor_id).toBe(1);
  });

  it("Should allow setting decimal as token number", async () => {
    const response = await request(app)
      .put("/agreements/1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}')
      .send({
        ...basicPutData,
        tokens: 1.5,
      });

    const agreement = await tryber.tables.FinanceAgreements.do()
      .select("tokens")
      .where({ id: 1 })
      .first();
    expect(agreement?.tokens).toBe(1.5);
  });

  it("Should allow setting decimal as token unit price", async () => {
    const response = await request(app)
      .put("/agreements/1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}')
      .send({
        ...basicPutData,
        unitPrice: 1.5,
      });

    const agreement = await tryber.tables.FinanceAgreements.do()
      .select("token_unit_price")
      .where({ id: 1 })
      .first();
    expect(agreement?.token_unit_price).toBe(1.5);
  });
});
