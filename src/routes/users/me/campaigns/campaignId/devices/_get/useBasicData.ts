import { tryber } from "@src/features/database";

const useBasicData = () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().insert({
      id: 1,
      wp_user_id: 1,
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
      },
      {
        id: 10,
        title: "My campaign",
        min_allowed_media: 4,
        campaign_type: 0,
      },
    ]);
    await tryber.tables.WpAppqOs.do().insert([
      {
        id: 1,
        display_name: "Lollipop",
        version_number: "5.1.1",
      },
      {
        id: 2,
        display_name: "XP",
        version_number: "1.0",
      },
    ]);
    await tryber.tables.WpAppqEvdPlatform.do().insert([
      {
        id: 1,
        name: "Android",
      },
      {
        id: 2,
        name: "Windows",
      },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.WpUsers.do().delete();
    await tryber.tables.WpAppqEvdProfile.do().delete();
    await tryber.tables.WpCrowdAppqDevice.do().delete();
    await tryber.tables.WpAppqOs.do().delete();
  });
};

export default useBasicData;
