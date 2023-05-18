import { tryber } from "@src/features/database";

const useBasicData = () => {
  beforeAll(async () => {
    await tryber.tables.WpUsers.do().insert({
      ID: 1,
    });
    await tryber.tables.WpAppqEvdProfile.do().insert({
      wp_user_id: 1,
      id: 1,
      email: "",
      employment_id: 1,
      education_id: 1,
    });
    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 1,
      title: "Campaign Title",
      base_bug_internal_id: "BASE1BUGINTERNAL",
      customer_title: "Customer Title",
      start_date: "2020-01-01",
      end_date: "2020-01-02",
      close_date: "2020-01-03",
      platform_id: 1,
      page_preview_id: 1,
      page_manual_id: 1,
      customer_id: 1,
      pm_id: 1,
      project_id: 1,
    });
    await tryber.tables.WpCrowdAppqHasCandidate.do().insert({
      selected_device: 1,
      accepted: 1,
      campaign_id: 1,
      user_id: 1,
    });
    await tryber.tables.WpAppqCampaignTask.do().insert({
      id: 1,
      title: "Title of usecase1",
      campaign_id: 1,
      content: "",
      jf_code: "",
      is_required: 1,
      jf_text: "",
      simple_title: "",
      info: "",
      prefix: "",
    });
    await tryber.tables.WpAppqCampaignTask.do().insert({
      id: 2,
      title: "Title of usecase1",
      campaign_id: 1,
      content: "",
      jf_code: "",
      is_required: 1,
      jf_text: "",
      simple_title: "",
      info: "",
      prefix: "",
    });
    await tryber.tables.WpAppqCampaignTaskGroup.do().insert({
      task_id: 1,
      group_id: 1,
    });

    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 2,
      title: "Campaign Title",
      base_bug_internal_id: "BASE1BUGINTERNAL",
      customer_title: "Customer Title",
      start_date: "2020-01-01",
      end_date: "2020-01-02",
      close_date: "2020-01-03",
      platform_id: 1,
      page_preview_id: 1,
      page_manual_id: 1,
      customer_id: 1,
      pm_id: 1,
      project_id: 1,
    });

    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 3,
      title: "Campaign Title",
      base_bug_internal_id: "BASE3BUGINTERNAL",
      customer_title: "Customer Title",
      start_date: "2020-01-01",
      end_date: "2020-01-02",
      close_date: "2020-01-03",
      platform_id: 1,
      page_preview_id: 1,
      page_manual_id: 1,
      customer_id: 1,
      pm_id: 1,
      project_id: 1,
    });

    await tryber.tables.WpCrowdAppqHasCandidate.do().insert({
      selected_device: 0,
      accepted: 1,
      campaign_id: 3,
      group_id: 1,
      user_id: 1,
    });

    await tryber.tables.WpAppqCampaignTask.do().insert({
      id: 4,
      title: "Title of usecase1",
      campaign_id: 3,
      content: "",
      jf_code: "",
      is_required: 1,
      jf_text: "",
      simple_title: "",
      info: "",
      prefix: "",
    });

    await tryber.tables.WpAppqCampaignTask.do().insert({
      id: 5,
      title: "Title of usecase1",
      campaign_id: 3,
      content: "",
      jf_code: "",
      is_required: 1,
      jf_text: "",
      simple_title: "",
      info: "",
      prefix: "",
      group_id: 1,
    });

    await tryber.tables.WpAppqCampaignTaskGroup.do().insert({
      task_id: 5,
      group_id: 1,
    });

    await tryber.tables.WpAppqEvdCampaign.do().insert({
      id: 4,
      title: "Campaign Title",
      base_bug_internal_id: "BASE4BUGINTERNAL",
      customer_title: "Customer Title",
      start_date: "2020-01-01",
      end_date: "2020-01-02",
      close_date: "2020-01-03",
      platform_id: 1,
      page_preview_id: 1,
      page_manual_id: 1,
      customer_id: 1,
      pm_id: 1,
      project_id: 1,
    });

    await tryber.tables.WpAppqCampaignTask.do().insert({
      id: 3,
      title: "Title of usecase1",
      campaign_id: 4,
      content: "",
      jf_code: "",
      is_required: 1,
      jf_text: "",
      simple_title: "",
      info: "",
      prefix: "",
      group_id: 1,
    });

    await tryber.tables.WpAppqCampaignTask.do().insert({
      id: 6,
      title: "Title of usecase1",
      campaign_id: 4,
      content: "",
      jf_code: "",
      is_required: 1,
      jf_text: "",
      simple_title: "",
      info: "",
      prefix: "",
      group_id: 2,
    });

    await tryber.tables.WpAppqCampaignTask.do().insert({
      id: 7,
      title: "Title of usecase1",
      campaign_id: 4,
      content: "",
      jf_code: "",
      is_required: 1,
      jf_text: "",
      simple_title: "",
      info: "",
      prefix: "",
      group_id: 0,
    });

    await tryber.tables.WpAppqCampaignTaskGroup.do().insert({
      task_id: 3,
      group_id: 1,
    });

    await tryber.tables.WpAppqCampaignTaskGroup.do().insert({
      task_id: 6,
      group_id: 2,
    });

    await tryber.tables.WpAppqCampaignTaskGroup.do().insert({
      task_id: 7,
      group_id: 0,
    });

    await tryber.tables.WpCrowdAppqHasCandidate.do().insert({
      selected_device: 0,
      accepted: 1,
      campaign_id: 4,
      group_id: 1,
      user_id: 1,
    });
  });

  afterAll(async () => {
    await tryber.tables.WpCrowdAppqHasCandidate.do().delete();
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpUsers.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpAppqCampaignTask.do().delete();
    await tryber.tables.WpAppqCampaignTaskGroup.do().delete();
  });
};

export default useBasicData;
