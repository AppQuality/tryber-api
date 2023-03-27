import { tryber } from "@src/features/database";

/**
 * Basic dataset for the test
 *
 * 1 tester
 * 1 deleted tester
 * 1 campaign
 * 1 candidature for the tester in the campaign
 * 1 candidature for the deleted user
 * payout configuration for the campaign
 *  - bug values
 *    - critical: 6
 *    - high: 2.5
 *    - medium: 1
 *    - low: 0.5
 *  - payout limit: 30
 *  - campaign complete bonus: 25
 *  - campaign complete pts: 200
 *  - point_multipliers:
 *    - critical: 0.6
 *    - high: 0.25
 *    - medium: 0.1
 *    - low: 0.05
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

    await tryber.tables.WpAppqEvdProfile.do().insert([
      {
        id: 100,
        name: "Deleted User",
        surname: "",
        wp_user_id: 110,
        email: "",
        employment_id: 1,
        education_id: 1,
      },
    ]);
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

    await tryber.tables.WpCrowdAppqHasCandidate.do().insert([
      {
        campaign_id: 1,
        user_id: 110,
        accepted: 1,
        devices: "0",
        selected_device: 1,
        results: 0,
        group_id: 1,
      },
    ]);

    await tryber.tables.WpAppqCpMeta.do().insert([
      {
        campaign_id: 1,
        meta_key: "critical_bug_payout",
        meta_value: "6",
      },
      {
        campaign_id: 1,
        meta_key: "high_bug_payout",
        meta_value: "2.5",
      },
      {
        campaign_id: 1,
        meta_key: "medium_bug_payout",
        meta_value: "1",
      },
      {
        campaign_id: 1,
        meta_key: "low_bug_payout",
        meta_value: "0.5",
      },
      {
        campaign_id: 1,
        meta_key: "payout_limit",
        meta_value: "30",
      },
      {
        campaign_id: 1,
        meta_key: "campaign_complete_bonus_eur",
        meta_value: "25",
      },
      {
        campaign_id: 1,
        meta_key: "minimum_bugs",
        meta_value: "1",
      },
      {
        campaign_id: 1,
        meta_key: "percent_usecases",
        meta_value: "75",
      },
      {
        campaign_id: 1,
        meta_key: "point_multiplier_critical",
        meta_value: "0.6",
      },
      {
        campaign_id: 1,
        meta_key: "point_multiplier_high",
        meta_value: "0.25",
      },
      {
        campaign_id: 1,
        meta_key: "point_multiplier_medium",
        meta_value: "0.1",
      },
      {
        campaign_id: 1,
        meta_key: "point_multiplier_low",
        meta_value: "0.05",
      },
    ]);
  });
};

export default useCampaign;
