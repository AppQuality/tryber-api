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

const payment_1 = {
  id: 11,
  tester_id: 1,
  campaign_id: 1,
  amount: 100.5,
  is_paid: 1,
  is_requested: 1,
  work_type: "test",
  note: "note",
  receipt_id: -1,
  work_type_id: 1,
};

const payment_2 = {
  ...payment_1,
  id: 22,
  tester_id: 2,
  campaign_id: 1,
  amount: 200.75,
  is_paid: 1,
  is_requested: 1,
  work_type_id: 2,
};

const payment_3 = {
  ...payment_1,
  id: 33,
  tester_id: 3,
  campaign_id: 2,
  amount: 300.25,
  is_paid: 1,
  is_requested: 1,
};

describe("GET /dossiers/campaignId/costs", () => {
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
    await tryber.tables.WpAppqPayment.do().insert([
      payment_1,
      payment_2,
      payment_3,
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqCustomer.do().delete();
  });

  it("Should answer 403 if not logged in", () => {
    return request(app).get("/dossiers/1/costs").expect(403);
  });
  it("Should answer 403 if logged in without permissions", async () => {
    const response = await request(app)
      .get("/dossiers/1/costs")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });
  it("Should answer 400 if campaign does not exists", async () => {
    const response = await request(app)
      .get("/dossiers/100/costs")
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(400);
  });

  it("Should answer 403 if logged as user without permissions on the campaign", async () => {
    const response = await request(app)
      .get("/dossiers/2/costs")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(403);
  });

  it("Should answer 200 if logged as user with full access on the campaign", async () => {
    const response = await request(app)
      .get("/dossiers/1/costs")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(200);
  });

  it("Should answer with the campaigns costs", async () => {
    const response = await request(app)
      .get("/dossiers/1/costs")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      totalCost: payment_1.amount + payment_2.amount,
    });
  });
  it("Should filterBy the costs by work_type_id", async () => {
    const response = await request(app)
      .get("/dossiers/1/costs?filterBy[type]=2")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      totalCost: payment_2.amount,
    });
  });

  it("Should filterBy the costs by multiple work_type_id", async () => {
    const response = await request(app)
      .get("/dossiers/1/costs?filterBy[type]=1,2")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      totalCost: payment_1.amount + payment_2.amount,
    });
  });

  it("Should ignore the filter if it the type is invalid", async () => {
    const response = await request(app)
      .get("/dossiers/1/costs?filterBy[type]=invalid")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      totalCost: payment_1.amount + payment_2.amount,
    });
  });
  it("Should ignore the filter if it the filter is invalid", async () => {
    const response = await request(app)
      .get("/dossiers/1/costs?filterBy[invalid]=1")
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');
    console.log(response.body);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      totalCost: payment_1.amount + payment_2.amount,
    });
  });
});
