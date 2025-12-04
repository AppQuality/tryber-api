import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const campaign = {
  platform_id: 1,
  start_date: "2023-01-13 10:10:10",
  end_date: "2023-01-14 10:10:10",
  title: "",
  page_preview_id: 1,
  page_manual_id: 1,
  customer_id: 1,
  pm_id: 1,
  customer_title: "",
};
const project = {
  display_name: "",
  edited_by: 1,
};
describe("GET /customers/customerId/agreements", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        ...campaign,
        id: 1,
        project_id: 1,
        tokens_usage: 5.5,
      },
      {
        ...campaign,
        id: 2,
        project_id: 1,
        tokens_usage: 2.3,
      },
    ]);
    await tryber.tables.WpAppqProject.do().insert([
      {
        ...project,
        display_name: "Project 1",
        id: 1,
        customer_id: 1,
      },
      {
        ...project,
        display_name: "Project 3",
        id: 3,
        customer_id: 2,
      },
    ]);
    await tryber.tables.WpAppqCustomer.do().insert([
      {
        id: 1,
        company: "Company 1",
        pm_id: 1,
      },
      {
        id: 2,
        company: "Company 2",
        pm_id: 1,
      },
    ]);
    await tryber.tables.FinanceAgreements.do().insert([
      {
        id: 1,
        title: "Agreement 1",
        agreement_close_date: "2023-01-10",
        additional_note: "Note 1",
        agreement_date: "2023-01-01",
        tokens: 51.7,
        token_unit_price: 1.5,
        is_token_based: 1,
        customer_id: 1,
      },
      {
        id: 2,
        title: "Agreement 2",
        agreement_close_date: "2023-01-11",
        additional_note: "Note 2",
        agreement_date: "2023-01-02",
        customer_id: 1,
        tokens: 5,
        token_unit_price: 2.7,
        is_token_based: 1,
      },
    ]);
    await tryber.tables.FinanceCampaignToAgreement.do().insert([
      {
        cp_id: 1,
        agreement_id: 1,
      },
      {
        cp_id: 2,
        agreement_id: 1,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqCustomer.do().delete();
  });

  it("Should answer 403 if not logged in", () => {
    return request(app).get("/customers/1/agreements").expect(403);
  });
  it("Should answer 403 if logged in without permissions", async () => {
    const response = await request(app)
      .get("/customers/1/agreements")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should answer 403 if customer does not exists", async () => {
    const response = await request(app)
      .get("/customers/100/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged as user with full access on campaigns", async () => {
    const response = await request(app)
      .get("/customers/1/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
  });
  it("Should answer 200 if logged as user with olps to some owned campaigns", async () => {
    const response = await request(app)
      .get("/customers/1/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1,2]}');
    expect(response.status).toBe(200);
  });

  it("Should answer 403 if logged as user with olps to only other campaigns", async () => {
    const response = await request(app)
      .get("/customers/1/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[3]}');
    expect(response.status).toBe(403);
  });

  it("Should answer with a list of all agreements of the customer if has full access", async () => {
    const response = await request(app)
      .get("/customers/1/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":true}');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("items");
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBe(2);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          name: "Agreement 1",
          totalTokens: 51.7,
          remainingTokens: 43.9, // totalTokens - token used in campaigns associated to the agreement
          value: 1.5,
        }),
        expect.objectContaining({
          id: 2,
          name: "Agreement 2",
          totalTokens: 5,
          remainingTokens: 5,
          value: 2.7,
        }),
      ])
    );
  });
});
