import { tryber } from "@src/features/database";

export default async (
  wpId: number,
  campaignId: number,
  selectedDevice: number
) => {
  const isCandidate = await tryber.tables.WpCrowdAppqHasCandidate.do()
    .select()
    .where("user_id", wpId)
    .where("campaign_id", campaignId);

  if (isCandidate.length) {
    await tryber.tables.WpCrowdAppqHasCandidate.do()
      .update({
        accepted: 1,
        selected_device: selectedDevice,
        accepted_date: tryber.fn.now(),
        results: 0,
      })
      .where("user_id", wpId)
      .where("campaign_id", campaignId);
  } else {
    await tryber.tables.WpCrowdAppqHasCandidate.do().insert({
      user_id: wpId,
      campaign_id: campaignId,
      accepted: 1,
      results: 0,
      devices: "0",
      selected_device: selectedDevice,
      group_id: 1,
      accepted_date: tryber.fn.now(),
    });
  }
  return {
    wordpress_id: wpId,
    campaign_id: campaignId,
    device: selectedDevice,
  };
};
