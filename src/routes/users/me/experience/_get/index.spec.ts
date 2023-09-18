import { insert } from "./../../../../../features/db/index";
import app from "@src/app";
import sqlite3 from "@src/features/sqlite";
import Campaigns from "@src/__mocks__/mockedDb/campaign";
import Experience from "@src/__mocks__/mockedDb/experience";
import Profile from "@src/__mocks__/mockedDb/profile";
import request from "supertest";
import { tryber } from "@src/features/database";

const tester1 = {
  id: 1,
  wp_user_id: 1,
  email: "john.doe@tryber.me",
  employment_id: 1,
  education_id: 1,
};
const campaign1 = {
  id: 1,
  title: "This is the Campaign title",
  platform_id: 1,
  start_date: new Date().toISOString(),
  end_date: new Date().toISOString(),
  page_preview_id: 1,
  page_manual_id: 1,
  customer_id: 1,
  pm_id: 1,
  project_id: 1,
  customer_title: "Customer Title",
};
const campaign2 = {
  id: 2,
  title: "This is the Campaign title",
  platform_id: 1,
  start_date: new Date().toISOString(),
  end_date: new Date().toISOString(),
  page_preview_id: 1,
  page_manual_id: 1,
  customer_id: 1,
  pm_id: 1,
  project_id: 1,
  customer_title: "Customer Title",
};
const exp1 = {
  id: 1,
  tester_id: tester1.id,
  activity_id: 1,
  reason: "I'm a reason",
  creation_date: "1970-01-01 00:00:00",
  amount: 20,
  campaign_id: campaign1.id,
  pm_id: 1,
};
const exp2 = {
  id: 2,
  tester_id: tester1.id,
  activity_id: 1,
  reason: "I'm a reason",
  creation_date: "1970-01-01 00:00:00",
  amount: 10,
  campaign_id: campaign2.id,
  pm_id: 1,
};

describe("GET /users/me/experience", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqExpPoints.do().insert([exp1, exp2]);
    await tryber.tables.WpAppqEvdCampaign.do().insert([campaign1, campaign2]);
    await tryber.tables.WpAppqEvdProfile.do().insert(tester1);
  });

  afterAll(async () => {
    await tryber.tables.WpAppqExpPoints.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
  });

  it("Should answer 403 if not logged in", async () => {
    const response = await request(app).get("/users/me/experience");
    expect(response.status).toBe(403);
  });
  it("Should answer 200 if logged in tryber", async () => {
    const response = await request(app)
      .get("/users/me/experience")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      results: [
        {
          id: exp1.id,
          activity: { id: exp1.activity_id },
          campaign: { id: campaign1.id, title: campaign1.title },
          date: "1970-01-01",
          amount: exp1.amount,
          note: exp1.reason,
        },
        {
          id: exp2.id,
          activity: {
            id: exp2.activity_id,
          },
          date: "1970-01-01",
          campaign: { id: campaign2.id, title: campaign2.title },
          amount: exp2.amount,
          note: exp2.reason,
        },
      ],
      size: 2,
      start: 0,
      sum: exp1.amount + exp2.amount,
    });
  });

  it("Should order based on order parameters", async () => {
    const responseAsc = await request(app)
      .get("/users/me/experience?order=ASC&orderBy=id")
      .set("authorization", "Bearer tester");
    expect(responseAsc.status).toBe(200);
    expect(responseAsc.body.results.map((item: any) => item.id)).toEqual([
      1, 2,
    ]);
    const responseDesc = await request(app)
      .get("/users/me/experience?order=DESC&orderBy=id")
      .set("authorization", "Bearer tester");
    expect(responseDesc.status).toBe(200);
    expect(responseDesc.body.results.map((item: any) => item.id)).toEqual([
      2, 1,
    ]);
  });

  it("Should return only campaign 1 experience points if filterBy[campaign]=1", async () => {
    const response = await request(app)
      .get("/users/me/experience?filterBy[campaign]=1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(
      response.body.results.map((item: { id: number }) => item.id)
    ).toEqual([exp1.id]);
  });

  it("Should return 1 result if is set limit parameter with limit = 1", async () => {
    const response = await request(app)
      .get("/users/me/experience?limit=1")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(200);
    expect(response.body.results.map((item: any) => item.id)).toEqual([1]);
    const responseASC = await request(app)
      .get("/users/me/experience?limit=1&order=ASC&orderBy=id")
      .set("authorization", "Bearer tester");
    expect(responseASC.status).toBe(200);
    expect(responseASC.body.results.map((item: any) => item.id)).toEqual([1]);
    const responseDESC = await request(app)
      .get("/users/me/experience?limit=1&order=DESC&orderBy=id")
      .set("authorization", "Bearer tester");
    expect(responseDESC.status).toBe(200);
    expect(responseDESC.body.results.map((item: any) => item.id)).toEqual([2]);
  });
});
describe("GET /users/me/experience - user without experience points", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert(campaign1);
    await tryber.tables.WpAppqEvdProfile.do().insert(tester1);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqExpPoints.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
  });

  it("Should answer 404 if the tryber hasn't experience entries", async () => {
    const response = await request(app)
      .get("/users/me/experience")
      .set("authorization", "Bearer tester");
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      element: "experience",
      id: 0,
      message: "Error on finding experience points",
    });
  });
});
