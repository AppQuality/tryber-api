import app from "@src/app";
import { tryber } from "@src/features/database";
import WordpressJsonApiTrigger from "@src/features/wp/WordpressJsonApiTrigger";
import request from "supertest";

jest.mock("@src/features/wp/WordpressJsonApiTrigger");
jest.mock("@src/features/webhookTrigger");

const baseRequest = {
  project: 1,
  testType: 1,
  title: {
    customer: "Campaign Title for Customer",
    tester: "Campaign Title for Tester",
  },
  startDate: "2019-08-24T14:15:22Z",
  deviceList: [1],
};

describe("Route POST /dossiers - duplication", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqProject.do().insert({
      id: 1,
      display_name: "Test Project",
      customer_id: 1,
      edited_by: 1,
    });

    await tryber.tables.WpAppqCampaignType.do().insert({
      id: 1,
      name: "Test Type",
      description: "Test Description",
      category_id: 1,
    });

    await tryber.tables.WpAppqEvdPlatform.do().insert([
      {
        id: 1,
        name: "Test Type",
        form_factor: 0,
        architecture: 1,
      },
    ]);

    await tryber.tables.WpOptions.do().insert({
      option_name: "polylang",
      option_value:
        'a:16:{s:7:"browser";b:1;s:7:"rewrite";i:1;s:12:"hide_default";i:1;s:10:"force_lang";i:1;s:13:"redirect_lang";i:1;s:13:"media_support";i:1;s:9:"uninstall";i:0;s:4:"sync";a:0:{}s:10:"post_types";a:2:{i:0;s:6:"manual";i:1;s:7:"preview";}s:10:"taxonomies";a:0:{}s:7:"domains";a:0:{}s:7:"version";s:5:"3.1.1";s:16:"first_activation";i:1562051895;s:12:"default_lang";s:2:"en";s:9:"nav_menus";a:1:{s:15:"crowdappquality";a:1:{s:7:"primary";a:2:{s:2:"en";i:2;s:2:"it";i:163;}}}s:16:"previous_version";s:3:"3.1";}',
    });
  });

  beforeEach(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 1,
      platform_id: 1,
      start_date: "1970-01-01",
      end_date: "1970-01-01",
      title: "Origin Campaign",
      customer_title: "Origin Campaign",
      page_manual_id: 1,
      page_preview_id: 2,
      customer_id: 1,
      project_id: 1,
      pm_id: 1,
    });

    await tryber.tables.WpAppqCampaignAdditionalFields.do().insert({
      cp_id: 1,
      slug: "field",
      title: "Field",
      type: "regex",
      validation: ".*",
      error_message: "Invalid format",
    });

    await tryber.tables.WpAppqCampaignTask.do().insert({
      id: 1,
      campaign_id: 1,
      title: "Task",
      content: "Task content",
      simple_title: "Task",
      info: "Task info",
      prefix: "T",
      language: "en",
      optimize_media: 1,
      is_required: 1,
      jf_code: "T",
      jf_text: "JF",
    });

    await tryber.tables.WpAppqCampaignTaskGroup.do().insert({
      task_id: 1,
      group_id: 4,
    });

    await tryber.tables.WpAppqCronJobs.do().insert({
      id: 1,
      campaign_id: 1,
      display_name: "Test Mail Merge",
      email_template_id: 1,
      template_text: "Test Template",
      template_json: "{}",
      last_editor_id: 1,
      creation_date: "1970-01-01",
      template_id: 1,
      update_date: "1970-01-01",
      executed_on: "",
    });

    const page = {
      post_content: "Test Content",
      post_status: "publish",
      post_author: 1,
      post_excerpt: "Test Excerpt",
      to_ping: "",
      pinged: "",
      post_content_filtered: "",
    };

    await tryber.tables.WpPosts.do().insert([
      {
        ...page,
        ID: 1,
        post_title: "CP1 - Test Manual",
        post_type: "manual",
      },
      {
        ...page,
        ID: 2,
        post_title: "CP1 - Test Preview",
        post_type: "preview",
      },
      {
        ...page,
        ID: 3,
        post_title: "CP1 - Test Manual (it)",
        post_type: "manual",
      },
      {
        ...page,
        ID: 4,
        post_title: "CP1 - Test Preview (it)",
        post_type: "preview",
      },
    ]);

    await tryber.tables.WpTermRelationships.do().insert([
      { object_id: 1, term_taxonomy_id: 1 },
      { object_id: 2, term_taxonomy_id: 2 },
    ]);

    await tryber.tables.WpTerms.do().insert([
      { term_id: 1, name: "pll_1234567", slug: "pll_1234567" },
      { term_id: 2, name: "pll_1234567", slug: "pll_1234567" },
    ]);

    await tryber.tables.WpTermTaxonomy.do().insert([
      {
        term_taxonomy_id: 1,
        term_id: 1,
        taxonomy: "post_translations",
        description: 'a:2:{s:2:"en";i:1;s:2:"it";i:3;}',
      },
      {
        term_taxonomy_id: 2,
        term_id: 2,
        taxonomy: "post_translations",
        description: 'a:2:{s:2:"en";i:2;s:2:"it";i:4;}',
      },
    ]);

    await tryber.tables.WpPostmeta.do().insert([
      {
        post_id: 1,
        meta_key: "_wp_page_template",
        meta_value: "page-manual.php",
      },
      { post_id: 1, meta_key: "acf_field", meta_value: "value" },
      {
        post_id: 2,
        meta_key: "_wp_page_template",
        meta_value: "page-preview.php",
      },
      { post_id: 2, meta_key: "acf_field", meta_value: "value" },
    ]);
    await tryber.tables.WpCrowdAppqHasCandidate.do().insert({
      user_id: 1,
      campaign_id: 1,
      subscription_date: "1970-01-01",
      accepted: 1,
      devices: "1",
      selected_device: 1,
      modified: "1970-01-01",
      group_id: 1,
    });
  });

  afterAll(async () => {
    await tryber.tables.WpAppqProject.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
  });
  afterEach(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.CampaignDossierData.do().delete();
    await tryber.tables.CampaignDossierDataBrowsers.do().delete();
    await tryber.tables.CampaignDossierDataCountries.do().delete();
    await tryber.tables.CampaignDossierDataLanguages.do().delete();
    await tryber.tables.WpAppqCampaignAdditionalFields.do().delete();
    await tryber.tables.WpAppqCampaignTask.do().delete();
    await tryber.tables.WpAppqCampaignTaskGroup.do().delete();
    await tryber.tables.WpAppqCronJobs.do().delete();
    await tryber.tables.WpPosts.do().delete();
    await tryber.tables.WpPostmeta.do().delete();
    await tryber.tables.WpTermRelationships.do().delete();
    await tryber.tables.WpTermTaxonomy.do().delete();
    await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
    await tryber.tables.WpTerms.do().delete();

    jest.clearAllMocks();
  });

  it("Should return 400 if campaign to duplicate does not exist", async () => {
    const fields = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, duplicate: { fields: 100 } });

    expect(fields.status).toBe(400);

    const useCases = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, duplicate: { useCases: 100 } });

    expect(useCases.status).toBe(400);

    const mailMerges = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, duplicate: { mailMerges: 100 } });

    expect(mailMerges.status).toBe(400);

    const pages = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, duplicate: { pages: 100 } });

    expect(pages.status).toBe(400);

    const testers = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, duplicate: { testers: 100 } });

    expect(testers.status).toBe(400);
  });

  it("Should duplicate additional fields", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, duplicate: { fields: 1 } });
    expect(response.status).toBe(201);

    const id = response.body.id;

    const fields = await tryber.tables.WpAppqCampaignAdditionalFields.do()
      .select()
      .where({ cp_id: id });

    expect(fields).toHaveLength(1);
    expect(fields[0]).toMatchObject({
      slug: "field",
      title: "Field",
      type: "regex",
      validation: ".*",
      error_message: "Invalid format",
    });
  });

  it("Should duplicate usecases", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, duplicate: { useCases: 1 } });
    expect(response.status).toBe(201);

    const id = response.body.id;

    const tasks = await tryber.tables.WpAppqCampaignTask.do()
      .select()
      .where({ campaign_id: id });

    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      title: "Task",
      content: "Task content",
      simple_title: "Task",
      info: "Task info",
      prefix: "T",
      language: "en",
      optimize_media: 1,
      is_required: 1,
      jf_code: "T",
      jf_text: "JF",
    });

    const groups = await tryber.tables.WpAppqCampaignTaskGroup.do()
      .select()
      .where({ task_id: tasks[0].id });

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ group_id: 4 });
  });

  it("Should duplicate mail merges", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, duplicate: { mailMerges: 1 } });

    expect(response.status).toBe(201);

    const id = response.body.id;

    const mailMerges = await tryber.tables.WpAppqCronJobs.do()
      .select()
      .where({ campaign_id: id });

    expect(mailMerges).toHaveLength(1);
    expect(mailMerges[0]).toMatchObject({
      display_name: "Test Mail Merge",
      email_template_id: 1,
      template_text: "Test Template",
      template_json: "{}",
      last_editor_id: 1,
    });
  });

  it("Should duplicate pages", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")

      .send({ ...baseRequest, duplicate: { pages: 1 } });

    const posts = await tryber.tables.WpPosts.do().select();

    expect(response.status).toBe(201);

    const id = response.body.id;

    const pages = await tryber.tables.WpAppqEvdCampaign.do()
      .select("page_manual_id", "page_preview_id")
      .where({ id });

    expect(pages).toHaveLength(1);

    const manualId = pages[0].page_manual_id;
    const previewId = pages[0].page_preview_id;

    const manual = await tryber.tables.WpPosts.do()
      .select()
      .where({ ID: manualId });

    expect(manual).toHaveLength(1);
    expect(manual[0]).toMatchObject({
      post_title: `CP${id} - Test Manual`,
      post_type: "manual",
      post_content: "Test Content",
      post_status: "draft",
      post_author: 1,
      post_excerpt: "Test Excerpt",
    });

    const preview = await tryber.tables.WpPosts.do()
      .select()
      .where({ ID: previewId });

    expect(preview).toHaveLength(1);

    expect(preview[0]).toMatchObject({
      post_title: `CP${id} - Test Preview`,
      post_type: "preview",
      post_content: "Test Content",
      post_status: "draft",
      post_author: 1,
      post_excerpt: "Test Excerpt",
    });

    const manualMeta = await tryber.tables.WpPostmeta.do()
      .select()
      .where({ post_id: manualId });

    expect(manualMeta).toHaveLength(2);
    expect(manualMeta[0]).toMatchObject({
      meta_key: "_wp_page_template",
      meta_value: "page-manual.php",
    });

    expect(manualMeta[1]).toMatchObject({
      meta_key: "acf_field",
      meta_value: "value",
    });

    const previewMeta = await tryber.tables.WpPostmeta.do()
      .select()
      .where({ post_id: previewId });

    expect(previewMeta).toHaveLength(2);
    expect(previewMeta[0]).toMatchObject({
      meta_key: "_wp_page_template",
      meta_value: "page-preview.php",
    });

    expect(previewMeta[1]).toMatchObject({
      meta_key: "acf_field",
      meta_value: "value",
    });
  });

  it("Should duplicate all languages", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")

      .send({ ...baseRequest, duplicate: { pages: 1 } });

    expect(response.status).toBe(201);

    const id = response.body.id;

    const posts = await tryber.tables.WpPosts.do().select();

    expect(posts).toHaveLength(8);

    expect(posts).toContainEqual(
      expect.objectContaining({
        post_title: `CP${id} - Test Manual`,
        post_type: "manual",
      })
    );
    expect(posts).toContainEqual(
      expect.objectContaining({
        post_title: `CP${id} - Test Preview`,
        post_type: "preview",
      })
    );
    expect(posts).toContainEqual(
      expect.objectContaining({
        post_title: `CP${id} - Test Manual (it)`,
        post_type: "manual",
      })
    );
    expect(posts).toContainEqual(
      expect.objectContaining({
        post_title: `CP${id} - Test Preview (it)`,
        post_type: "preview",
      })
    );
  });

  it("Should duplicate testers", async () => {
    const response = await request(app)
      .post("/dossiers")
      .set("authorization", "Bearer admin")
      .send({ ...baseRequest, duplicate: { testers: 1 } });

    expect(response.status).toBe(201);

    const id = response.body.id;

    const testers = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select()
      .where({ campaign_id: id });

    expect(testers).toHaveLength(1);

    expect(testers[0]).toMatchObject({
      user_id: 1,
      campaign_id: id,
      subscription_date: "1970-01-01",
      accepted: 1,
      devices: "1",
      selected_device: 1,
      modified: "1970-01-01",
      group_id: 1,
    });
  });

  it("Should not post to wordpress if usecase is duplicated", async () => {
    const response = await request(app)
      .post("/dossiers")
      .send({ ...baseRequest, duplicate: { useCases: 1 } })
      .set("Authorization", "Bearer admin");

    expect(response.status).toBe(201);

    const id = response.body.id;

    expect(
      WordpressJsonApiTrigger.prototype.generateUseCase
    ).not.toHaveBeenCalled();
  });

  it("Should not post to wordpress if mailmerge is duplicated", async () => {
    const response = await request(app)
      .post("/dossiers")
      .send({ ...baseRequest, duplicate: { mailMerges: 1 } })
      .set("Authorization", "Bearer admin");

    expect(response.status).toBe(201);

    const id = response.body.id;

    expect(
      WordpressJsonApiTrigger.prototype.generateMailMerges
    ).not.toHaveBeenCalled();
  });

  it("Should not post to wordpress if mailmerge is duplicated", async () => {
    const response = await request(app)
      .post("/dossiers")
      .send({ ...baseRequest, duplicate: { mailMerges: 1 } })
      .set("Authorization", "Bearer admin");

    expect(response.status).toBe(201);

    const id = response.body.id;

    expect(
      WordpressJsonApiTrigger.prototype.generateMailMerges
    ).not.toHaveBeenCalled();
  });

  it("Should not post to wordpress if pages is duplicated", async () => {
    const response = await request(app)
      .post("/dossiers")
      .send({ ...baseRequest, duplicate: { pages: 1 } })
      .set("Authorization", "Bearer admin");

    expect(response.status).toBe(201);

    const id = response.body.id;

    expect(
      WordpressJsonApiTrigger.prototype.generatePages
    ).not.toHaveBeenCalled();
  });
});
