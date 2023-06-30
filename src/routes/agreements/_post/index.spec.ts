import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const basicPostData: StoplightOperations["post-agreements"]["requestBody"]["content"]["application/json"] =
  {
    title: "Agreement",
    tokens: 10,
    unitPrice: 1,
    startDate: "2020-01-01",
    expirationDate: "2020-01-01",
    customerId: 1,
  };
describe("POST /agreements", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqCustomer.do().insert([
      {
        id: 1,
        company: "Company",
        pm_id: 1,
      },
    ]);
  });
  afterEach(async () => {
    await tryber.tables.FinanceAgreements.do().delete();
  });

  it("Should return 403 if not logged in", async () => {
    const response = await request(app).post("/agreements").send(basicPostData);
    expect(response.status).toBe(403);
  });
  it("Should return 403 if logged in as tester", async () => {
    const response = await request(app)
      .post("/agreements")
      .set("Authorization", "Bearer tester")
      .send(basicPostData);
    expect(response.status).toBe(403);
  });
  it("Should return 403 if logged in as user with single campaign olp", async () => {
    const response = await request(app)
      .post("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,2]}')
      .send(basicPostData);
    expect(response.status).toBe(403);
  });
  it("Should return 200 if logged in as user with full access to campaign", async () => {
    const response = await request(app)
      .post("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}')
      .send(basicPostData);
    expect(response.status).toBe(200);
  });

  it("Should create a new agreement on success", async () => {
    const agreementsBefore = await tryber.tables.FinanceAgreements.do().select(
      "id"
    );
    const response = await request(app)
      .post("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}')
      .send(basicPostData);
    console.log(response.body);
    const agreementsAfter = await tryber.tables.FinanceAgreements.do().select(
      "id"
    );
    expect(agreementsAfter.length).toBe(agreementsBefore.length + 1);
  });

  it("Should return the id of the created agreement", async () => {
    const response = await request(app)
      .post("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}')
      .send(basicPostData);
    const agreement = await tryber.tables.FinanceAgreements.do()
      .select("id")
      .where({ id: response.body.agreementId })
      .first();
    expect(agreement).toBeDefined();
  });

  it("Should create an agreement with the specified title", async () => {
    const response = await request(app)
      .post("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}')
      .send({ ...basicPostData, title: "Test Agreement" });
    const agreement = await tryber.tables.FinanceAgreements.do()
      .select("title")
      .where({ id: response.body.agreementId })
      .first();
    expect(agreement?.title).toBe("Test Agreement");
  });
  it("Should create an agreement with the specified tokens", async () => {
    const response = await request(app)
      .post("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}')
      .send({ ...basicPostData, tokens: 123 });
    const agreement = await tryber.tables.FinanceAgreements.do()
      .select("tokens")
      .where({ id: response.body.agreementId })
      .first();
    expect(agreement?.tokens).toBe(123);
  });
  it("Should create an agreement with the specified tokens price", async () => {
    const response = await request(app)
      .post("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}')
      .send({ ...basicPostData, unitPrice: 123 });
    const agreement = await tryber.tables.FinanceAgreements.do()
      .select("token_unit_price")
      .where({ id: response.body.agreementId })
      .first();
    expect(agreement?.token_unit_price).toBe(123);
  });

  it("Should create an agreement with the specified start date", async () => {
    const response = await request(app)
      .post("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}')
      .send({ ...basicPostData, startDate: "2021-01-01" });
    const agreement = await tryber.tables.FinanceAgreements.do()
      .select("agreement_date")
      .where({ id: response.body.agreementId })
      .first();
    expect(agreement?.agreement_date).toBe("2021-01-01");
  });
  it("Should create an agreement with the specified end date", async () => {
    const response = await request(app)
      .post("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}')
      .send({ ...basicPostData, expirationDate: "2021-01-01" });
    const agreement = await tryber.tables.FinanceAgreements.do()
      .select("agreement_close_date")
      .where({ id: response.body.agreementId })
      .first();
    expect(agreement?.agreement_close_date).toBe("2021-01-01");
  });

  it("Should create an agreement with the specified notes", async () => {
    const response = await request(app)
      .post("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}')
      .send({ ...basicPostData, note: "test notes" });
    const agreement = await tryber.tables.FinanceAgreements.do()
      .select("additional_note")
      .where({ id: response.body.agreementId })
      .first();
    expect(agreement?.additional_note).toBe("test notes");
  });

  it("Should create an agreement with empty note if notes are not specified", async () => {
    const response = await request(app)
      .post("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}')
      .send({ ...basicPostData });
    const agreement = await tryber.tables.FinanceAgreements.do()
      .select("additional_note")
      .where({ id: response.body.agreementId })
      .first();
    expect(agreement?.additional_note).toBe("");
  });

  it("Should return 403 if the customer specified does not exists", async () => {
    const response = await request(app)
      .post("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}')
      .send({ ...basicPostData, customerId: 999999 });
    expect(response.status).toBe(403);
  });

  it("Should create an agreement with the specified customer", async () => {
    const response = await request(app)
      .post("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}')
      .send({ ...basicPostData, customerId: 1 });
    const agreement = await tryber.tables.FinanceAgreements.do()
      .select("customer_id")
      .where({ id: response.body.agreementId })
      .first();
    expect(agreement?.customer_id).toBe(1);
  });

  it("Should set the agreement as not tokenbased by default", async () => {
    const { isTokenBased, ...postData } = basicPostData;
    const response = await request(app)
      .post("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}')
      .send({ ...postData });
    const agreement = await tryber.tables.FinanceAgreements.do()
      .select("is_token_based")
      .where({ id: response.body.agreementId })
      .first();
    expect(agreement?.is_token_based).toBe(0);
  });

  it("Should create an agreement tokenbased if specified", async () => {
    const response = await request(app)
      .post("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}')
      .send({ ...basicPostData, isTokenBased: true });
    const agreement = await tryber.tables.FinanceAgreements.do()
      .select("is_token_based")
      .where({ id: response.body.agreementId })
      .first();
    expect(agreement?.is_token_based).toBe(1);
  });

  it("Should set last_editor_id as the current user on a new agreement", async () => {
    const response = await request(app)
      .post("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}')
      .send(basicPostData);
    const agreement = await tryber.tables.FinanceAgreements.do()
      .select("last_editor_id")
      .where({ id: response.body.agreementId })
      .first();
    expect(agreement?.last_editor_id).toBe(1);
  });

  it("Should allow setting decimal as token number", async () => {
    const response = await request(app)
      .post("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}')
      .send({
        ...basicPostData,
        tokens: 1.5,
      });

    const agreement = await tryber.tables.FinanceAgreements.do()
      .select("tokens")
      .where({ id: response.body.agreementId })
      .first();
    expect(agreement?.tokens).toBe(1.5);
  });

  it("Should allow setting decimal as token unit price", async () => {
    const response = await request(app)
      .post("/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}')
      .send({
        ...basicPostData,
        unitPrice: 1.5,
      });

    const agreement = await tryber.tables.FinanceAgreements.do()
      .select("token_unit_price")
      .where({ id: response.body.agreementId })
      .first();
    expect(agreement?.token_unit_price).toBe(1.5);
  });
});
