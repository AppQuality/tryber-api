import PreselectionFormData from "@src/features/db/class/PreselectionFormData";
import Profile, { ProfileObject } from "@src/features/db/class/Profile";
import Question from ".";

class GenderQuestion extends Question<{
  type: `gender`;
}> {
  private testerId: number;
  constructor(
    question: typeof GenderQuestion.constructor.arguments[0],
    testerId: number
  ) {
    super(question);
    this.testerId = testerId;
  }
  async getItem(): Promise<{
    id: number;
    type: string;
    question: string;
    value?: ProfileObject["gender"];
  }> {
    return {
      ...this.getDefault(),
      value: await this.getGender(),
    };
  }

  async getGender() {
    const profile = new Profile();
    try {
      const tester = await profile.get(this.testerId);
      if (tester.gender) {
        return tester.gender;
      }
    } catch (e) {}
    return undefined;
  }

  async isDataInsertable({
    campaignId,
    data,
  }: {
    campaignId: number;
    data: {
      question: number;
      value: { serialized: string };
    };
  }): Promise<boolean> {
    return Object.values(ProfileObject.availableGenders).includes(
      data.value.serialized
    );
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
      tester_id: this.testerId,
      value: data.value.serialized,
    });
    await this.updateGender(data.value.serialized);
  }
  async updateGender(value: string) {
    const profile = new Profile();
    profile.update({
      data: { sex: ProfileObject.getGenderNumericValue(value) },
      where: [{ id: this.testerId }],
    });
  }
}

export default GenderQuestion;
