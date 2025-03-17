import app from "@src/app";
import { tryber } from "@src/features/database";
import request from "supertest";

describe("Route POST /dossiers/:id/manual", () => {
  beforeAll(async () => {
    await tryber.tables.WpOptions.do().insert([
      {
        option_name: "polylang",
        option_value: 'a:1:{s:12:"default_lang";s:2:"en";}',
      },
    ]);
    await tryber.seeds().campaign_statuses();
    await tryber.tables.WpAppqProject.do().insert([
      { id: 1, customer_id: 1, display_name: "Project 1", edited_by: 1 },
    ]);
    await tryber.tables.WpAppqCustomer.do().insert([
      { id: 1, company: "Customer 1", pm_id: 1 },
    ]);
    await tryber.tables.WpAppqCampaignType.do().insert([
      { id: 1, name: "Type 1", category_id: 1 },
    ]);
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        id: 1,
        wp_user_id: 1,
        name: "CSM",
        surname: "",
        email: "",
        education_id: 1,
        employment_id: 1,
      },
    ]);
  });

  afterAll(async () => {
    await tryber.tables.CampaignPhase.do().delete();
    await tryber.tables.CampaignPhaseType.do().delete();
    await tryber.tables.WpAppqProject.do().delete();
    await tryber.tables.WpAppqCustomer.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
  });

  beforeEach(async () => {
    const campaign = {
      title: "Campaign 1",
      customer_title: "Customer 1",
      platform_id: 1,
      pm_id: 1,
      campaign_type_id: 1,
      page_manual_id: 1,
      page_preview_id: 1,
      start_date: "2021-01-01T00:00:00.000Z",
      end_date: "2021-12-31T00:00:00.000Z",
      close_date: "2022-01-01T00:00:00.000Z",
      customer_id: 1,
      project_id: 1,
      phase_id: 1,
      os: "",
    };

    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        ...campaign,
        id: 1,
      },
      {
        ...campaign,
        id: 10,
        page_manual_id: 20,
      },
    ]);

    await tryber.tables.WpPosts.do().insert([
      {
        ID: 20,
        post_title: "Campaign 10",
        post_type: "manual",
        post_content: "manual content",
        post_excerpt: "",
        to_ping: "",
        pinged: "",
        post_content_filtered: "",
      },
    ]);

    await tryber.tables.WpPostmeta.do().insert([
      { post_id: 20, meta_key: "man_campaign_id", meta_value: "1" },
      { post_id: 20, meta_key: "other_meta", meta_value: "xxx" },
    ]);
  });

  afterEach(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpPosts.do().delete();
    await tryber.tables.WpPostmeta.do().delete();
  });

  it("Should return 403 if not logged in", async () => {
    const response = await request(app)
      .post("/dossiers/1/manual")
      .send({ importFrom: 10 });
    expect(response.status).toBe(403);
  });

  it("Should return 200 if logged in as admin", async () => {
    const response = await request(app)
      .post("/dossiers/1/manual")
      .send({ importFrom: 10 })
      .set("Authorization", "Bearer admin");

    expect(response.status).toBe(200);
  });

  it("Should return 403 if logged in as tester", async () => {
    const response = await request(app)
      .post("/dossiers/1/manual")
      .send({ importFrom: 10 })
      .set("Authorization", "Bearer tester");

    expect(response.status).toBe(403);
  });

  it("Should return 200 if has access to the campaign", async () => {
    const response = await request(app)
      .post("/dossiers/1/manual")
      .send({ importFrom: 10 })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[1]}');

    expect(response.status).toBe(200);
  });

  it("Should return 403 if campaign does not exists", async () => {
    const response = await request(app)
      .post("/dossiers/100/manual")
      .send({ importFrom: 10 })
      .set("Authorization", 'Bearer tester olp {"appq_campaign":[100]}');

    expect(response.status).toBe(403);
  });

  it("Should create a new manual post", async () => {
    const response = await request(app)
      .post("/dossiers/1/manual")
      .send({ importFrom: 10 })
      .set("Authorization", "Bearer admin");

    expect(response.status).toBe(200);

    const posts = await tryber.tables.WpPosts.do().whereNot("ID", 20);

    expect(posts).toHaveLength(1);
  });
  it("Should link the new manual to the campaign", async () => {
    const response = await request(app)
      .post("/dossiers/1/manual")
      .send({ importFrom: 10 })
      .set("Authorization", "Bearer admin");

    expect(response.status).toBe(200);

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select("page_manual_id")
      .where("id", 1)
      .first();

    expect(campaign).not.toBeUndefined();

    if (!campaign) return;

    expect(campaign.page_manual_id).not.toBe(20);

    const manualPost = await tryber.tables.WpPosts.do()
      .where("ID", campaign.page_manual_id)
      .first();

    expect(manualPost).not.toBeUndefined();
  });
  it("Should keep all the meta except man_campaign_id", async () => {
    const response = await request(app)
      .post("/dossiers/1/manual")
      .send({ importFrom: 10 })
      .set("Authorization", "Bearer admin");

    expect(response.status).toBe(200);

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select("page_manual_id")
      .where("id", 1)
      .first();

    expect(campaign).not.toBeUndefined();

    if (!campaign) return;

    expect(campaign.page_manual_id).not.toBe(20);

    const newPreviewMeta = await tryber.tables.WpPostmeta.do()
      .select("meta_key", "meta_value")
      .where("post_id", campaign.page_manual_id)
      .whereNot("meta_key", "man_campaign_id");

    const oldPreviewMeta = await tryber.tables.WpPostmeta.do()
      .select("meta_key", "meta_value")
      .where("post_id", 20)
      .whereNot("meta_key", "man_campaign_id");

    expect(newPreviewMeta).toHaveLength(oldPreviewMeta.length);

    expect(newPreviewMeta).toEqual(oldPreviewMeta);
  });

  it("Should update meta man_campaign_id with new campaign id", async () => {
    const response = await request(app)
      .post("/dossiers/1/manual")
      .send({ importFrom: 10 })
      .set("Authorization", "Bearer admin");

    expect(response.status).toBe(200);

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select("page_manual_id")
      .where("id", 1)
      .first();

    expect(campaign).not.toBeUndefined();

    if (!campaign) return;

    expect(campaign.page_manual_id).not.toBe(20);

    const newPreviewMeta = await tryber.tables.WpPostmeta.do()
      .select("meta_key", "meta_value")
      .where("post_id", campaign.page_manual_id)
      .where("meta_key", "man_campaign_id")
      .first();

    expect(newPreviewMeta?.meta_value).toEqual("1");
  });

  it("Should update post title with new campaign id", async () => {
    const response = await request(app)
      .post("/dossiers/1/manual")
      .send({ importFrom: 10 })
      .set("Authorization", "Bearer admin");

    expect(response.status).toBe(200);

    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select("page_manual_id")
      .where("id", 1)
      .first();

    expect(campaign).not.toBeUndefined();

    if (!campaign) return;

    const newPreviewPost = await tryber.tables.WpPosts.do()
      .select("post_title")
      .where("ID", campaign.page_manual_id)
      .first();

    expect(newPreviewPost?.post_title).toEqual("Campaign 1");
  });
});
