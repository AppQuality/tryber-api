import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

beforeAll(async () => {
  await tryber.tables.WpAppqEvdCampaign.do().insert({
    id: 1,
    platform_id: 1,
    start_date: "2020-01-01",
    end_date: "2020-01-01",
    title: "This is the title",
    page_preview_id: 1,
    page_manual_id: 1,
    customer_id: 1,
    pm_id: 1,
    project_id: 1,
    customer_title: "",
    campaign_pts: 200,
  });
});
beforeEach(async () => {
  await tryber.tables.WpAppqProspect.do().insert({
    id: 1,
    campaign_id: 1,
    status: "draft",
    last_modified: "",
  });
});

afterEach(async () => {
  await tryber.tables.WpAppqProspect.do().delete();
});

describe("PATCH /campaigns/campaignId/prospect with one prospect", () => {
  it("Should return 304 if send empty object", async () => {
    const response = await request(app)
      .patch("/campaigns/1/prospect")
      .send({})
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(304);
  });

  it("Should return 501 send status done", async () => {
    const response = await request(app)
      .patch("/campaigns/1/prospect")
      .send({ status: "done" })
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(501);
  });

  it("Should return 403 if logged out", async () => {
    const response = await request(app)
      .patch("/campaigns/1/prospect")
      .send({ status: "confirmed" });
    expect(response.status).toBe(403);
  });

  it("Should return 403 if logged in as not admin user", async () => {
    const response = await request(app)
      .patch("/campaigns/1/prospect")
      .send({ status: "confirmed" })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 400 if campaign does not exists", async () => {
    const response = await request(app)
      .patch("/campaigns/100/prospect")
      .send({ status: "confirmed" })
      .set("Authorization", "Bearer tester");

    expect(response.status).toBe(400);
  });

  it("Should return 200 if logged in as admin", async () => {
    const response = await request(app)
      .patch("/campaigns/1/prospect")
      .send({ status: "confirmed" })
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should return 200 if logged in as tester with olp tester_selection", async () => {
    console.log(await tryber.tables.WpAppqProspect.do().select());
    const response = await request(app)
      .patch("/campaigns/1/prospect")
      .send({ status: "confirmed" })
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.status).toBe(200);
    const prospect = await tryber.tables.WpAppqProspect.do()
      .select()
      .where({ campaign_id: 1 })
      .first();
    expect(prospect?.status).toBe("confirmed");
  });
});

describe("PATCH /campaigns/campaignId/prospect when no prospect", () => {
  // campaign_id should me unique \

  //if send the same status retrun 304
  // if there no prospect same tests...
  // on_duplicate_key_update unguess analitics

  beforeEach(async () => {
    await tryber.tables.WpAppqProspect.do().delete();
  });

  it("Should return 304 if send empty object", async () => {
    const response = await request(app)
      .patch("/campaigns/1/prospect")
      .send({})
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(304);
  });

  it("Should return 501 send status done", async () => {
    const response = await request(app)
      .patch("/campaigns/1/prospect")
      .send({ status: "done" })
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(501);
  });

  it("Should return 403 if logged out", async () => {
    const response = await request(app)
      .patch("/campaigns/1/prospect")
      .send({ status: "confirmed" });
    expect(response.status).toBe(403);
  });

  it("Should return 403 if logged in as not admin user", async () => {
    const response = await request(app)
      .patch("/campaigns/1/prospect")
      .send({ status: "confirmed" })
      .set("Authorization", "Bearer tester");
    expect(response.status).toBe(403);
  });

  it("Should return 400 if campaign does not exists", async () => {
    const response = await request(app)
      .patch("/campaigns/100/prospect")
      .send({ status: "confirmed" })
      .set("Authorization", "Bearer tester");

    expect(response.status).toBe(400);
  });

  it("Should return 200 if logged in as admin", async () => {
    const response = await request(app)
      .patch("/campaigns/1/prospect")
      .send({ status: "confirmed" })
      .set("Authorization", "Bearer admin");
    expect(response.status).toBe(200);
  });

  it("Should return 200 if logged in as tester with olp tester_selection", async () => {
    console.log(await tryber.tables.WpAppqProspect.do().select());
    const response = await request(app)
      .patch("/campaigns/1/prospect")
      .send({ status: "confirmed" })
      .set("Authorization", 'Bearer tester olp {"appq_tester_selection":[1]}');
    expect(response.status).toBe(200);
    const prospect = await tryber.tables.WpAppqProspect.do()
      .select()
      .where({ campaign_id: 1 })
      .first();
    expect(prospect?.status).toBe("confirmed");
  });
});
