import { getCpData } from ".";
import { tryber } from "@src/features/database";

describe("getCpData", () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 69,
      title: "Title - Functional Campaign",
      description: "Functional Campaign",
      campaign_type: 1,
      campaign_type_id: 1,
      project_id: 6969,
      platform_id: 1,
      start_date: "2021-01-01",
      end_date: "2021-01-01",
      page_preview_id: 1,
      page_manual_id: 1,
      pm_id: 1,
      customer_id: 1,
      customer_title: "Customer Title - Functional Campaign",
    });
    await tryber.tables.WpAppqCampaignTask.do().insert([
      {
        id: 10,
        campaign_id: 69,
        title: "Title - Campaign Task",
        content: "Functional Campaign",
        jf_code: "jf_code",
        jf_text: "jf_text",
        is_required: 1,
        simple_title: "simple_title",
        info: "info",
        prefix: "prefix",
      },
      {
        id: 20,
        campaign_id: 69,
        title: "Title - Campaign Task",
        content: "Functional Campaign",
        jf_code: "jf_code",
        jf_text: "jf_text",
        is_required: 1,
        simple_title: "simple_title",
        info: "info",
        prefix: "prefix",
      },
      {
        id: 999,
        campaign_id: 9999,
        title: "Title - Campaign Task other cp",
        content: "Functional Campaign",
        jf_code: "jf_code",
        jf_text: "jf_text",
        is_required: 1,
        simple_title: "simple_title",
        info: "info",
        prefix: "prefix",
      },
    ]);
    await tryber.tables.WpAppqCampaignTaskGroup.do().insert([
      {
        task_id: 10,
        group_id: 1,
      },
      {
        task_id: 20,
        group_id: 0,
      },
      {
        task_id: 999,
        group_id: 0,
      },
    ]);
    await tryber.tables.WpAppqUserTask.do().insert([
      {
        id: 100,
        task_id: 10,
        tester_id: 11111,
        is_completed: 1,
      },
      {
        id: 101,
        task_id: 10,
        tester_id: 32,
        is_completed: 0,
      },
      {
        id: 102,
        task_id: 999,
        tester_id: 32,
        is_completed: 1,
      },
    ]);
    await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
      {
        user_id: 11111,
        campaign_id: 69,
      },
      {
        user_id: 32,
        campaign_id: 69,
      },
      {
        user_id: 32,
        campaign_id: 9999,
      },
    ]);
    await tryber.tables.WpAppqEvdBug.do().insert([
      {
        id: 1,
        campaign_id: 69,
        wp_user_id: 11111,
        reviewer: 32,
        last_editor_id: 11111,
      },
      {
        id: 2,
        campaign_id: 69,
        wp_user_id: 32,
        reviewer: 11111,
        last_editor_id: 11111,
      },
      {
        id: 999,
        campaign_id: 9999,
        wp_user_id: 11111,
        reviewer: 32,
        last_editor_id: 11111,
      },
    ]);
    await tryber.tables.WpAppqEvdBugMedia.do().insert([
      {
        id: 10,
        bug_id: 1,
      },
      {
        id: 20,
        bug_id: 2,
      },
      {
        id: 999,
        bug_id: 999,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqCampaignTask.do().delete();
    await tryber.tables.WpAppqCampaignTaskGroup.do().delete();
    await tryber.tables.WpAppqUserTask.do().delete();
    await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
    await tryber.tables.WpAppqEvdBug.do().delete();
    await tryber.tables.WpAppqEvdBugMedia.do().delete();
  });

  it("Should return empty object if campaign does not exist", async () => {
    const cpId = 9999;
    const campaigns = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where("id", cpId);
    expect(campaigns.length).toBe(0);
    const cpData = await getCpData({ cpId });

    expect(cpData).toBeInstanceOf(Object);
    expect(cpData).toMatchObject({});
  });

  it("Should return campaign data", async () => {
    const cpId = 69;
    const campaigns = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where("id", cpId);
    expect(campaigns.length).toBe(1);
    const data = await getCpData({ cpId });

    expect(data).toHaveProperty("campaign");
    expect(data.campaign).toMatchObject({
      id: 69,
      title: "Title - Functional Campaign",
      description: "Functional Campaign",
      campaign_type: 1,
      campaign_type_id: 1,
      project_id: 6969,
      platform_id: 1,
      start_date: "2021-01-01",
      end_date: "2021-01-01",
      page_preview_id: 1,
      page_manual_id: 1,
      pm_id: 1,
      customer_id: 1,
      customer_title: "Customer Title - Functional Campaign",
    });
  });

  it("Should return campaign usecases if campagin has usecases", async () => {
    const cpId = 69;
    const data = await getCpData({ cpId });

    expect(data).toHaveProperty("usecases");
    expect(data.usecases).toHaveLength(2);
    expect(data.usecases).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 10,
          campaign_id: 69,
          title: "Title - Campaign Task",
        }),
        expect.objectContaining({
          id: 20,
          campaign_id: 69,
          title: "Title - Campaign Task",
        }),
      ])
    );
  });
  it("Should return campaign usecaseGroups if campagin has group of usecases", async () => {
    const cpId = 69;
    const data = await getCpData({ cpId });

    expect(data).toHaveProperty("usecaseGroups");
    expect(data.usecaseGroups).toHaveLength(2);
    expect(data.usecaseGroups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          task_id: 10,
          group_id: 1,
        }),
        expect.objectContaining({
          task_id: 20,
          group_id: 0,
        }),
      ])
    );
  });
  it("Should return campaign userTask if campagin has user tasks", async () => {
    const cpId = 69;
    const data = await getCpData({ cpId });
    expect(data).toHaveProperty("userTasks");
    expect(data.userTasks).toHaveLength(2);
    expect(data.userTasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 100,
          task_id: 10,
          tester_id: 11111,
        }),
        expect.objectContaining({
          id: 101,
          task_id: 10,
          tester_id: 32,
        }),
      ])
    );
  });
  it("Should return campaign candidates if campagin has candidates", async () => {
    const cpId = 69;
    const data = await getCpData({ cpId });
    expect(data).toHaveProperty("candidates");
    expect(data.candidates).toHaveLength(2);
    expect(data.candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: 11111,
          campaign_id: 69,
        }),
        expect.objectContaining({
          user_id: 32,
          campaign_id: 69,
        }),
      ])
    );
  });
  it("Should return campaign bugs if campaign has bugs", async () => {
    const cpId = 69;
    const data = await getCpData({ cpId });
    expect(data).toHaveProperty("bugs");
    expect(data.bugs).toHaveLength(2);
    expect(data.bugs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          campaign_id: 69,
          wp_user_id: 11111,
          reviewer: 32,
          last_editor_id: 11111,
        }),
        expect.objectContaining({
          id: 2,
          campaign_id: 69,
          wp_user_id: 32,
          reviewer: 11111,
          last_editor_id: 11111,
        }),
      ])
    );
  });
  it("Should return bugMedias if campaign has bugMedias", async () => {
    const cpId = 69;
    const data = await getCpData({ cpId });
    expect(data).toHaveProperty("bugMedias");
    expect(data.bugMedias).toHaveLength(2);
    expect(data.bugMedias).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 10,
          bug_id: 1,
        }),
        expect.objectContaining({
          id: 20,
          bug_id: 2,
        }),
      ])
    );
  });
});
