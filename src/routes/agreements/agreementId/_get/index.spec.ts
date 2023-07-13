import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const basicAgreement = {
  title: "Agreement",
  tokens: 10,
  token_unit_price: 1,
  agreement_date: "2020-01-01",
  agreement_close_date: "2020-01-01",
  additional_note: "",
  last_editor_id: 999,
};
describe("DELETE /agreements/{agreementId}", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqCustomer.do().insert([
      {
        id: 1,
        company: "Company",
        pm_id: 999,
      },
    ]);
    await tryber.tables.FinanceAgreements.do().insert([
      {
        ...basicAgreement,
        id: 1,
        customer_id: 1,
        is_token_based: 0,
      },
      {
        ...basicAgreement,
        id: 2,
        customer_id: 1,
        additional_note: "Additional note",
        is_token_based: 1,
      },
    ]);
  });

  it("Should return 403 if not logged in", async () => {
    const response = await request(app).get("/agreements/1");
    expect(response.status).toBe(403);
  });

  it("Should return 403 if logged in as tester", async () => {
    const response = await request(app)
      .get("/agreements/1")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should return 403 if logged in as user with single campaign olp", async () => {
    const response = await request(app)
      .get("/agreements/1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,2]}');
    expect(response.status).toBe(403);
  });
  it("Should return 200 if logged in as user with full access to campaign", async () => {
    const response = await request(app)
      .get("/agreements/1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
  });

  it("Should return 403 if agreement does not exists", async () => {
    const response = await request(app)
      .get("/agreements/9999")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(403);
  });

  it("Should return agreement id", async () => {
    const response = await request(app)
      .get("/agreements/1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body).toHaveProperty("id", 1);
  });

  it("Should return agreement title", async () => {
    const response = await request(app)
      .get("/agreements/1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body).toHaveProperty("title", basicAgreement.title);
  });

  it("Should return agreement start date", async () => {
    const response = await request(app)
      .get("/agreements/1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body).toHaveProperty(
      "startDate",
      basicAgreement.agreement_date
    );
  });

  it("Should return agreement end date", async () => {
    const response = await request(app)
      .get("/agreements/1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body).toHaveProperty(
      "expirationDate",
      basicAgreement.agreement_close_date
    );
  });

  it("Should return agreement tokens", async () => {
    const response = await request(app)
      .get("/agreements/1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body).toHaveProperty("tokens", basicAgreement.tokens);
  });
  it("Should return agreement token unit price", async () => {
    const response = await request(app)
      .get("/agreements/1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body).toHaveProperty(
      "unitPrice",
      basicAgreement.token_unit_price
    );
  });

  it("Should return agreement customer", async () => {
    const response = await request(app)
      .get("/agreements/1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body).toHaveProperty("customer", {
      id: 1,
      company: "Company",
    });
  });

  it("Should not return note if are empty", async () => {
    const response = await request(app)
      .get("/agreements/1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body).not.toHaveProperty("note");
  });
  it("Should return note if are not empty", async () => {
    const response = await request(app)
      .get("/agreements/2")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.body).toHaveProperty("note", "Additional note");
  });

  it("Should return if is token based", async () => {
    const notTokenBased = await request(app)
      .get("/agreements/1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(notTokenBased.body).toHaveProperty("isTokenBased", false);
    const tokenBased = await request(app)
      .get("/agreements/2")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(tokenBased.body).toHaveProperty("isTokenBased", true);
  });
});
