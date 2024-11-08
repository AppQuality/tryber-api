import { tryber } from "@src/features/database";

export default async (
  wpId: number,
  campaignId: number,
  selectedDevice: number
) => {
  await tryber.tables.WpCrowdAppqHasCandidate.do()
    .insert({
      user_id: wpId,
      campaign_id: campaignId,
      accepted: 1,
      results: 0,
      devices: "0",
      selected_device: selectedDevice,
      group_id: 1,
      accepted_date: tryber.fn.now(),
    })
    .onConflict(["user_id", "campaign_id"])
    .merge({
      accepted: 1,
      selected_device: selectedDevice,
      accepted_date: tryber.fn.now(),
      results: 0,
    });

  return {
    wordpress_id: wpId,
    campaign_id: campaignId,
    device: selectedDevice,
  };
};
