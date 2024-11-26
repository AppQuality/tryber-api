import { tryber } from "@src/features/database";

// ux - UxCampaignData
// questions - UxCampaignQuestions
const copyUxData = async ({
  sourceCpId,
  targetCpId,
}: {
  sourceCpId: number;
  targetCpId: number;
}) => {
  const sourceData = await tryber.tables.UxCampaignData.do()
    .select(
      "published",
      "methodology_type",
      "methodology_description",
      "goal",
      "users"
    )
    .where("campaign_id", sourceCpId)
    .first();

  if (sourceData) {
    await tryber.tables.UxCampaignData.do().insert({
      ...sourceData,
      campaign_id: targetCpId,
    });
  }

  const sourceQuestions = await tryber.tables.UxCampaignQuestions.do()
    .select("question")
    .where("campaign_id", sourceCpId);

  if (sourceQuestions.length) {
    await tryber.tables.UxCampaignQuestions.do().insert(
      sourceQuestions.map((question) => ({
        ...question,
        campaign_id: targetCpId,
      }))
    );
  }
};

export { copyUxData };
