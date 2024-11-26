import { copyUxData } from ".";
import { tryber } from "@src/features/database";

describe("copyUxData", () => {
  const sourceCampaignId = 69;

  beforeAll(async () => {
    await tryber.tables.UxCampaignData.do().insert([
      {
        id: 1,
        campaign_id: sourceCampaignId,
        published: 1,
        methodology_type: "metodology1",
        methodology_description: "methodology_description",
        goal: "goal",
        users: 15,
      },
      {
        id: 2,
        campaign_id: 9999,
        published: 1,
        methodology_type: "metodology1",
        methodology_description: "methodology_description",
        goal: "goal",
        users: 15,
      },
    ]);
    await tryber.tables.UxCampaignQuestions.do().insert([
      { id: 1, campaign_id: sourceCampaignId, question: "question1" },
      { id: 2, campaign_id: sourceCampaignId, question: "question2" },
    ]);
  });
  afterAll(async () => {
    await tryber.tables.UxCampaignData.do().delete();
    await tryber.tables.UxCampaignQuestions.do().delete();
  });
  it("Should copy the ux data from source to target campaign", async () => {
    const targetCpId = 12345;
    await copyUxData({ sourceCpId: sourceCampaignId, targetCpId: targetCpId });
    const columnUx = [
      "published",
      "methodology_type",
      "methodology_description",
      "goal",
      "users",
    ];
    const sourceData = await tryber.tables.UxCampaignData.do()
      .select(columnUx)
      .where("campaign_id", sourceCampaignId);
    const targetData = await tryber.tables.UxCampaignData.do()
      .select(columnUx)
      .where("campaign_id", targetCpId);
    expect(targetData).toHaveLength(1);
    expect(targetData).toMatchObject(sourceData);
  });
  it("Should copy the questions from source to target campaign", async () => {
    const targetCpId = 54321;
    await copyUxData({ sourceCpId: sourceCampaignId, targetCpId: targetCpId });
    const sourceQuestions = await tryber.tables.UxCampaignQuestions.do()
      .select("question")
      .where("campaign_id", sourceCampaignId);
    const targetQuestions = await tryber.tables.UxCampaignQuestions.do()
      .select("question")
      .where("campaign_id", targetCpId);
    expect(targetQuestions).toHaveLength(sourceQuestions.length);
    expect(targetQuestions).toMatchObject(sourceQuestions);
  });
});
