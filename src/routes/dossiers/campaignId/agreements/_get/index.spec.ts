import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

const campaign_1 = {
  id: 1,
  project_id: 1,
  platform_id: 1,
  start_date: "2023-01-13 10:10:10",
  end_date: "2023-01-14 10:10:10",
  title: "",
  page_preview_id: 1,
  page_manual_id: 1,
  customer_id: 1,
  pm_id: 1,
  customer_title: "",
  tokens_usage: 25,
};
const campaign_2 = {
  ...campaign_1,
  id: 2,
  project_id: 1,
  tokens_usage: 10,
};
const campaign_3 = {
  ...campaign_1,
  id: 3,
  project_id: 1,
  tokens_usage: 5,
};
const project = {
  display_name: "",
  edited_by: 1,
};
describe("GET /dossiers/campaignId/agreements", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      campaign_1,
      campaign_2,
      campaign_3,
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
        token_unit_price: 1.5,
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
      {
        cp_id: 3,
        agreement_id: 1,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqCustomer.do().delete();
  });

  it("Should answer 403 if not logged in", () => {
    return request(app).get("/dossiers/1/agreements").expect(403);
  });
  it("Should answer 403 if logged in without permissions", async () => {
    const response = await request(app)
      .get("/dossiers/1/agreements")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should answer 403 if campaign does not exists", async () => {
    const response = await request(app)
      .get("/dossiers/100/agreements")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should answer 403 if logged as user without permissions on the campaign", async () => {
    const response = await request(app)
      .get("/dossiers/2/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(403);
  });

  it("Should answer 200 if logged as user with full access on the campaign", async () => {
    const response = await request(app)
      .get("/dossiers/1/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(200);
  });

  it("Should answer with the campaigns agreement", async () => {
    const response = await request(app)
      .get("/dossiers/1/agreements")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        tokens: campaign_1.tokens_usage,
        agreement: {
          id: 1,
          name: "Agreement 1",
          totalTokens: 51.7,
          remainingTokens: 11.7,
          value: 1.5,
        },
      })
    );
  });
});
