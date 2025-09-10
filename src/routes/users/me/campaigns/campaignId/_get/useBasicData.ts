import { tryber } from "@src/features/database";

const useBasicData = () => {
  const modules = [
    {
      type: "title",
      output: "plan title",
      variant: "default",
    },
    {
      type: "goal",
      output: "Example: goal of the campaign",
      variant: "default",
    },
    {
      type: "dates",
      output: {
        start: "2025-03-12T23:00:00.000",
      },
      variant: "default",
    },
    {
      type: "tasks",
      variant: "default",
      output: [
        {
          kind: "video",
          title: "string",
        },
      ],
    },
  ];

  const config = { modules: modules };

  beforeAll(async () => {
    await tryber.tables.CpReqPlans.do().insert({
      id: 1,
      name: "Plan 1",
      config: JSON.stringify(config),
    });
    await tryber.tables.WpAppqCampaignType.do().insert({
      id: 1,
      name: "Bug Hunting",
      description: "Bug Hunting Campaigns",
      category_id: 1,
      type: 0,
      has_auto_apply: 0,
    });
    await tryber.seeds().campaign_statuses();
    await tryber.tables.WpAppqEvdProfile.do().insert({
      id: 1,
      name: "tester",
      surname: "tester",
      email: "tester@example.com",
      pending_booty: 0,
      wp_user_id: 1,
      is_verified: 0,
      last_activity: new Date("01/01/2021").toISOString(),
      total_exp_pts: 1000,
      employment_id: 1,
      education_id: 1,
    });
    await tryber.tables.WpUsers.do().insert({
      ID: 1,
      user_login: "tester",
      user_email: "tester@example.com",
      user_pass: "pass",
    });
    await tryber.tables.WpCrowdAppqHasCandidate.do().insert({
      campaign_id: 1,
      user_id: 1,
      group_id: 1,
      accepted: 1,
    });
    await tryber.tables.WpAppqEvdSeverity.do().insert([
      { id: 1, name: "Low" },
      { id: 2, name: "Medium" },
    ]);
    await tryber.tables.WpAppqEvdBugType.do().insert([
      { id: 1, name: "Typo", is_enabled: 1 },
      { id: 2, name: "Crash", is_enabled: 1 },
      { id: 3, name: "Atomic", is_enabled: 0 },
    ]);
    await tryber.tables.WpAppqEvdBugReplicability.do().insert([
      { id: 1, name: "Once" },
      { id: 2, name: "Always" },
    ]);
    //usecases
    await tryber.tables.WpAppqCampaignTask.do().insert([
      {
        id: 1,
        title: "Second Usecase All groups",
        prefix: "prefix",
        simple_title: "Second Usecase All groups",
        group_id: 0,
        position: 2,
        campaign_id: 1,
        content: "content",
        jf_code: "jf_code",
        jf_text: "jf_text",
        is_required: 1,
        info: "info",
      },
      {
        id: 2,
        title: "First Usecase All groups",
        prefix: "prefix",
        simple_title: "First Usecase All groups",
        group_id: 0,
        position: 1,
        campaign_id: 1,
        content: "content",
        jf_code: "jf_code",
        jf_text: "jf_text",
        is_required: 1,
        info: "info",
      },
      {
        id: 3,
        title: "Third Usecase All groups",
        prefix: "prefix",
        simple_title: "Third Usecase All groups",
        group_id: 0,
        position: 2,
        campaign_id: 1,
        content: "content",
        jf_code: "jf_code",
        jf_text: "jf_text",
        is_required: 1,
        info: "info",
      },
      {
        id: 4,
        title: "Fourth Usecase Group 1",
        prefix: "prefix",
        simple_title: "Fourth Usecase Group 1",
        group_id: 1,
        position: 4,
        campaign_id: 1,
        content: "content",
        jf_code: "jf_code",
        jf_text: "jf_text",
        is_required: 1,
        info: "info",
      },
      {
        id: 5,
        title: "Fourth Usecase Group 2",
        prefix: "prefix",
        simple_title: "Fourth Usecase Group 2",
        group_id: 2,
        position: 4,
        campaign_id: 1,
        content: "content",
        jf_code: "jf_code",
        jf_text: "jf_text",
        is_required: 1,
        info: "info",
      },
      {
        id: 6,
        title: "Usecase of another campaign",
        prefix: "prefix",
        simple_title: "Usecase of another campaign",
        group_id: 0,
        position: 0,
        campaign_id: 2,
        content: "content",
        jf_code: "jf_code",
        jf_text: "jf_text",
        is_required: 1,
        info: "info",
      },
      {
        id: 7,
        title: "Usecase multigroup",
        prefix: "prefix",
        simple_title: "Usecase multigroup",
        group_id: -1,
        position: 5,
        campaign_id: 1,
        content: "content",
        jf_code: "jf_code",
        jf_text: "jf_text",
        is_required: 1,
        info: "info",
      },
      {
        id: 8,
        title: "Usecase multigroup of another campaign",
        prefix: "prefix",
        simple_title: "Usecase multigroup of another campaign",
        group_id: -1,
        position: 5,
        campaign_id: 2,
        content: "content",
        jf_code: "jf_code",
        jf_text: "jf_text",
        is_required: 1,
        info: "info",
      },
      {
        id: 9,
        title: "Usecase multigroup without current user",
        prefix: "prefix",
        simple_title: "Usecase multigroup without current user",
        group_id: -1,
        position: 5,
        campaign_id: 1,
        content: "content",
        jf_code: "jf_code",
        jf_text: "jf_text",
        is_required: 1,
        info: "info",
      },
      {
        id: 10,
        title: "Usecase multigroup all groups",
        prefix: "prefix",
        simple_title: "Usecase multigroup all groups",
        group_id: -1,
        position: 10,
        campaign_id: 1,
        content: "content",
        jf_code: "jf_code",
        jf_text: "jf_text",
        is_required: 1,
        info: "info",
      },
    ]);
    //Usecase groups
    await tryber.tables.WpAppqCampaignTaskGroup.do().insert([
      { task_id: 7, group_id: 1 },
      { task_id: 7, group_id: 2 },
      { task_id: 8, group_id: 1 },
      { task_id: 8, group_id: 2 },
      { task_id: 9, group_id: 2 },
      { task_id: 9, group_id: 3 },
      { task_id: 10, group_id: 0 },
    ]);
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        id: 1,
        title: "My campaign",
        min_allowed_media: 4,
        campaign_type: 0,
        campaign_type_id: 1,
        platform_id: 1,
        start_date: "2020-01-01 00:00:00",
        end_date: "2020-12-31 23:59:59",
        page_preview_id: 1,
        page_manual_id: 1,
        customer_id: 1,
        pm_id: 1,
        project_id: 1,
        customer_title: "My campaign",
        phase_id: 20,
        plan_id: 1,
      },
      {
        id: 2,
        title: "My campaign",
        min_allowed_media: 4,
        campaign_type: 0,
        platform_id: 1,
        start_date: "2020-01-01 00:00:00",
        end_date: "2020-12-31 23:59:59",
        page_preview_id: 1,
        page_manual_id: 1,
        customer_id: 1,
        pm_id: 1,
        project_id: 1,
        customer_title: "My campaign",
        phase_id: 20,
      },
    ]);
    await tryber.tables.WpOptions.do().insert({
      option_name: "options_appq_valid_upload_extensions",
      option_value: "jpg,png,gif",
    });
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpUsers.do().delete();
    await tryber.tables.WpOptions.do().delete();
    await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
    await tryber.tables.WpAppqEvdSeverity.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpAppqEvdBugType.do().delete();
    await tryber.tables.WpAppqEvdBugReplicability.do().delete();
    await tryber.tables.WpAppqCampaignTask.do().delete();
    await tryber.tables.WpAppqCampaignTaskGroup.do().delete();
    await tryber.tables.WpOptions.do().delete();
    await tryber.tables.CpReqPlans.do().delete();
    await tryber.tables.WpAppqCampaignType.do().delete();
  });
};

export default useBasicData;
