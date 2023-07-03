import { tryber } from "@src/features/database";

const useBasicData = () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().insert({
      id: 1,
      wp_user_id: 1,
      employment_id: 1,
      education_id: 1,
      email: "",
    });
    await tryber.tables.WpUsers.do().insert({
      ID: 1,
    });
    await tryber.tables.WpAppqEvdCampaign.do().insert([
      {
        id: 1,
        title: "My campaign",
        min_allowed_media: 4,
        campaign_type: 0,
        platform_id: 1,
        page_manual_id: 1,
        page_preview_id: 1,
        start_date: "2020-01-01",
        end_date: "2020-01-01",
        close_date: "2020-01-01",
        customer_id: 1,
        pm_id: 1,
        project_id: 1,
        customer_title: "",
      },
      {
        id: 10,
        title: "My campaign",
        min_allowed_media: 4,
        campaign_type: 0,
        platform_id: 1,
        page_manual_id: 1,
        page_preview_id: 1,
        start_date: "2020-01-01",
        end_date: "2020-01-01",
        close_date: "2020-01-01",
        customer_id: 1,
        pm_id: 1,
        project_id: 1,
        customer_title: "",
      },
    ]);
    await tryber.tables.WpAppqOs.do().insert([
      {
        id: 1,
        display_name: "Lollipop",
        version_number: "5.1.1",
        platform_id: 1,
        main_release: 1,
        version_family: 1,
      },
      {
        id: 2,
        display_name: "XP",
        version_number: "1.0",
        platform_id: 1,
        main_release: 1,
        version_family: 1,
      },
    ]);
    await tryber.tables.WpAppqEvdPlatform.do().insert([
      {
        id: 1,
        name: "Android",
        architecture: 1,
      },
      {
        id: 2,
        name: "Windows",
        architecture: 1,
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpAppqEvdCampaign.do().delete();
    await tryber.tables.WpUsers.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpAppqEvdPlatform.do().delete();
    await tryber.tables.WpCrowdAppqDevice.do().delete();
    await tryber.tables.WpAppqOs.do().delete();
  });
};

export default useBasicData;
