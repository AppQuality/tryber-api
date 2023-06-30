import CustomUserFieldData from "@src/features/db/class/CustomUserFieldData";
import { CustomUserFieldObject } from "@src/features/db/class/CustomUserFields";
import PreselectionFormData from "@src/features/db/class/PreselectionFormData";
import Question from ".";

class CufTextQuestion extends Question<{
  type: `cuf_${number}`;
}> {
  private customUserField: CustomUserFieldObject;
  private testerId: number;

  constructor({
    question,
    customUserField,
    testerId,
  }: {
    question: typeof CufTextQuestion.constructor.arguments[0];
    customUserField: CustomUserFieldObject;
    testerId: number;
  }) {
    super(question);
    this.customUserField = customUserField;
    this.testerId = testerId;
  }

  async getItem(): Promise<{
    id: number;
    type: string;
    question: string;
    validation?: { regex: string; error?: string };
    value?: string;
  }> {
    return {
      ...this.getDefault(),
      type: this.question.type,
      validation: this.getCufOptions(),
      value: await this.getValue(),
    };
  }

  async getValue() {
    const customUserFieldData = new CustomUserFieldData();
    const cufDataItem = await customUserFieldData.query({
      where: [
        { custom_user_field_id: this.customUserField.id },
        { profile_id: this.testerId },
      ],
    });
    if (cufDataItem.length === 0 || typeof cufDataItem[0].value === "number")
      return undefined;
    return cufDataItem[0].value;
  }

  private getCufOptions() {
    const result = this.customUserField.options.split(";").map((o) => o.trim());
    if (result.length === 0) return undefined;
    return {
      regex: result[0],
      error: result.length > 1 ? result[1] : undefined,
    };
  }

  async isDataInsertable({
    campaignId,
    data,
  }: {
    campaignId: number;
    data: { question: number; value: { serialized: string } };
  }): Promise<boolean> {
    const options = this.getCufOptions();
    if (!options) return true;
    return new RegExp(options.regex).test(data.value.serialized);
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
    await this.updateCuf(data.value.serialized);
  }

  private async updateCuf(value: string) {
    const customUserFieldData = new CustomUserFieldData();
    const oldValue = await this.getValue();
    if (typeof oldValue !== "undefined") {
      await customUserFieldData.update({
        where: [
          { custom_user_field_id: this.customUserField.id },
          { profile_id: this.testerId },
        ],
        data: { value },
      });
    } else {
      await customUserFieldData.insert({
        custom_user_field_id: this.customUserField.id,
        profile_id: this.testerId,
        value,
        candidate: 0,
      });
    }
  }
}

export default CufTextQuestion;
