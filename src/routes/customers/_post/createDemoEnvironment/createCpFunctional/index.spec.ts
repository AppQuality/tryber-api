import { createCpFunctional } from ".";
import { tryber } from "@src/features/database";

describe("createCpFunctional", () => {
  const targetCampaignId = 69;
  const targetProjectId = 6969;

  beforeAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: targetCampaignId,
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
        campaign_id: targetCampaignId,
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
        campaign_id: targetCampaignId,
      },
      {
        user_id: 32,
        campaign_id: targetCampaignId,
      },
      {
        user_id: 32,
        campaign_id: 9999,
      },
    ]);
    await tryber.tables.WpAppqEvdBug.do().insert([
      {
        id: 1,
        campaign_id: targetCampaignId,
        wp_user_id: 11111,
        reviewer: 32,
        last_editor_id: 11111,
      },
      {
        id: 2,
        campaign_id: targetCampaignId,
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

  it("Should insert one row in wp_appq_evd_campaigns", async () => {
    const campaignBefore = await tryber.tables.WpAppqEvdCampaign.do().select();

    await createCpFunctional({
      projectId: targetProjectId,
      sourceCpId: targetCampaignId,
    });
    const campaignAfter = await tryber.tables.WpAppqEvdCampaign.do().select();
    expect(campaignAfter.length).toBe(campaignBefore.length + 1);
  });
  it("Should insert the functional campaign with same data the target campaign except projectId", async () => {
    const campaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where("id", targetCampaignId)
      .first();

    const { cpIdFunctional: newCampaignId } = await createCpFunctional({
      projectId: targetCampaignId,
      sourceCpId: targetCampaignId,
    });

    const newCampaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where("id", newCampaignId)
      .first();

    expect(newCampaign).toMatchObject({
      title: campaign?.title,
      description: campaign?.description,
      campaign_type: campaign?.campaign_type,
      campaign_type_id: campaign?.campaign_type_id,
      platform_id: campaign?.platform_id,
      start_date: campaign?.start_date,
      end_date: campaign?.end_date,
      page_preview_id: campaign?.page_preview_id,
      page_manual_id: campaign?.page_manual_id,
      pm_id: campaign?.pm_id,
      customer_id: campaign?.customer_id,
      customer_title: campaign?.customer_title,
    });
  });
  it("Should insert the functional campaign with target projectId", async () => {
    const { cpIdFunctional: newCampaignId } = await createCpFunctional({
      projectId: targetProjectId,
      sourceCpId: targetCampaignId,
    });

    const newCampaign = await tryber.tables.WpAppqEvdCampaign.do()
      .select()
      .where("id", newCampaignId)
      .first();

    expect(newCampaign).toMatchObject({
      project_id: targetProjectId,
    });
  });
  it("Should insert the same number of candidates of target-campaign candidates", async () => {
    const targetCandidates = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select()
      .where("campaign_id", targetCampaignId);

    const { cpIdFunctional: newCampaignId } = await createCpFunctional({
      projectId: targetProjectId,
      sourceCpId: targetCampaignId,
    });

    const newCandidates = await tryber.tables.WpCrowdAppqHasCandidate.do()
      .select()
      .where("campaign_id", newCampaignId);
    expect(newCandidates.length).toEqual(targetCandidates.length);
  });
  it("Should insert the same number of usecases of target-usecases", async () => {
    const targetTasks = await tryber.tables.WpAppqCampaignTask.do()
      .select()
      .where("campaign_id", targetCampaignId);

    const { cpIdFunctional: newCampaignId } = await createCpFunctional({
      projectId: targetProjectId,
      sourceCpId: targetCampaignId,
    });

    const newTasks = await tryber.tables.WpAppqCampaignTask.do()
      .select()
      .where("campaign_id", newCampaignId);
    expect(newTasks.length).toEqual(targetTasks.length);
  });
  //   it("Should insert the same number of task-groups of target-campaign task-groups", async () => {
  //     const targetTaskGroups = await tryber.tables.WpAppqCampaignTaskGroup.do()
  //       .select()
  //       .where("campaign_id", targetCampaignId);

  //     const { cpIdFunctional: newCampaignId } = await createCpFunctional({
  //       projectId: targetProjectId,
  //       sourceCpId: targetCampaignId,
  //     });

  //     const newTaskGroups = await tryber.tables.WpAppqCampaignTaskGroup.do()
  //       .select()
  //       .where("campaign_id", newCampaignId);
  //     expect(newTaskGroups.length).toEqual(targetTaskGroups.length);
  //   });
  it("Should insert the same number of user-tasks of target-campaign user-tasks", async () => {
    const targetTaskIds = await tryber.tables.WpAppqCampaignTask.do()
      .select("id")
      .where("campaign_id", targetCampaignId);

    const targetUserTasks = await tryber.tables.WpAppqUserTask.do()
      .select()
      .whereIn(
        "task_id",
        targetTaskIds.map((task) => task.id)
      );

    const { cpIdFunctional: newCampaignId } = await createCpFunctional({
      projectId: targetProjectId,
      sourceCpId: targetCampaignId,
    });

    const newTaskIds = await tryber.tables.WpAppqCampaignTask.do()
      .select("id")
      .where("campaign_id", newCampaignId);

    const newUserTasks = await tryber.tables.WpAppqUserTask.do()
      .select()
      .whereIn(
        "task_id",
        newTaskIds.map((task) => task.id)
      );
    expect(newUserTasks.length).toEqual(targetUserTasks.length);
  });
  it("Should insert the same number of bugs of target-campaign bugs", async () => {
    const targetBugs = await tryber.tables.WpAppqEvdBug.do()
      .select()
      .where("campaign_id", targetCampaignId);

    const { cpIdFunctional: newCampaignId } = await createCpFunctional({
      projectId: targetProjectId,
      sourceCpId: targetCampaignId,
    });

    const newBugs = await tryber.tables.WpAppqEvdBug.do()
      .select()
      .where("campaign_id", newCampaignId);
    expect(newBugs.length).toEqual(targetBugs.length);
  });
  it("Should insert the same number of bug-medias of target-campaign bug-medias", async () => {
    const targetBugIds = await tryber.tables.WpAppqEvdBug.do()
      .select("id")
      .where("campaign_id", targetCampaignId);

    const targetBugMedias = await tryber.tables.WpAppqEvdBugMedia.do()
      .select()
      .whereIn(
        "bug_id",
        targetBugIds.map((bug) => bug.id)
      );

    const { cpIdFunctional: newCampaignId } = await createCpFunctional({
      projectId: targetProjectId,
      sourceCpId: targetCampaignId,
    });

    const newBugIds = await tryber.tables.WpAppqEvdBug.do()
      .select("id")
      .where("campaign_id", newCampaignId);

    const newBugMedias = await tryber.tables.WpAppqEvdBugMedia.do()
      .select()
      .whereIn(
        "bug_id",
        newBugIds.map((bug) => bug.id)
      );
    expect(newBugMedias.length).toEqual(targetBugMedias.length);
  });
});
