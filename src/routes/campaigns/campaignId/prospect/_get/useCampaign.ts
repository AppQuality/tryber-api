import { tryber } from "@src/features/database";

/**
 * Basic dataset for the test
 *
 * 1 tester
 * 1 campaign
 * 1 candidature for the tester in the campaign
 *
 */

const useCampaign = () => {
  beforeAll(async () => {
    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        // tester che ha completato al 100% la campagna - il default è 75%
        id: 1,
        name: "John",
        surname: "Doe",
        wp_user_id: 1,
        email: "",
        employment_id: 1,
        education_id: 1,
      },
    ]);
    await tryber.tables.WpUsers.do().insert([{ ID: 1 }]);
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
    });

    await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
      {
        campaign_id: 1,
        user_id: 1,
        accepted: 1,
        devices: "0",
        selected_device: 1,
        results: 0,
        group_id: 1,
      },
    ]);
  });
};

export default useCampaign;
