import Question from ".";
import Profile, { ProfileObject } from "@src/features/db/class/Profile";
import PreselectionFormData from "@src/features/db/class/PreselectionFormData";

class PhoneQuestion extends Question<{
  type: `phone_number`;
}> {
  private regex = "^\\+?[0-9]{12,14}$";
  constructor(
    question: typeof PhoneQuestion.constructor.arguments[0],
    private testerId: number
  ) {
    super(question);
  }

  async getItem(): Promise<{
    id: number;
    type: string;
    question: string;
    validation?: { regex: string };
    value?: ProfileObject["phone_number"];
  }> {
    return {
      ...this.getDefault(),
      type: this.question.type,
      validation: {
        regex: this.regex,
      },
      value: await this.getPhone(),
    };
  }

  async getPhone() {
    const profile = new Profile();
    try {
      const tester = await profile.get(this.testerId);
      if (tester.phone_number) {
        return tester.phone_number;
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
    return new RegExp(this.regex).test(data.value.serialized);
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
    await this.updatePhone(data.value.serialized);
  }
  async updatePhone(value: string) {
    const profile = new Profile();
    profile.update({
      data: { phone_number: value },
      where: [{ id: this.testerId }],
    });
  }
}

export default PhoneQuestion;
