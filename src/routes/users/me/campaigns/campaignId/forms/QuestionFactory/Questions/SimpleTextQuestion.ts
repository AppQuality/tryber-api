import Question from ".";
import PreselectionFormData from "@src/features/db/class/PreselectionFormData";

class SimpleTextQuestion extends Question<{
  type: `text`;
}> {
  private testerId: number;
  constructor(
    question: typeof SimpleTextQuestion.constructor.arguments[0],
    testerId: number
  ) {
    super(question);
    this.testerId = testerId;
  }

  async insertData({
    campaignId,
    data,
  }: {
    campaignId: number;
    data: { question: number; value: { serialized: string } };
  }): Promise<void> {
    const preselectionFormData = new PreselectionFormData();
    await preselectionFormData.insert({
      campaign_id: campaignId,
      field_id: data.question,
      value: data.value.serialized,
    });
  }
}

export default SimpleTextQuestion;
