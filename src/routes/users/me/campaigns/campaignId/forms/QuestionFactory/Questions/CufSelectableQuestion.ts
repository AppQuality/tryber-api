import Question from ".";
import CustomUserFieldDatas from "@src/features/db/class/CustomUserFieldData";
import { CustomUserFieldExtrasObject } from "@src/features/db/class/CustomUserFieldExtras";
import { CustomUserFieldObject } from "@src/features/db/class/CustomUserFields";
import PreselectionFormData from "@src/features/db/class/PreselectionFormData";

class CufSelectQuestion extends Question<{
  type: `cuf_${number}`;
}> {
  private customUserField: CustomUserFieldObject;
  private testerId: number;
  private options: number[];

  constructor({
    question,
    customUserField,
    options,
    testerId,
  }: {
    question: typeof CufSelectQuestion.constructor.arguments[0];
    customUserField: CustomUserFieldObject;
    options: CustomUserFieldExtrasObject[];
    testerId: number;
  }) {
    super(question);
    this.customUserField = customUserField;
    this.testerId = testerId;
    const validOptions = JSON.parse(this.question.options);

    this.options = options
      .filter((o) => validOptions.includes(o.id))
      .map((o) => o.id);
  }
  async getItem(): Promise<{
    id: number;
    type: string;
    question: string;
    options: number[];
    value?: number | number[];
  }> {
    return {
      ...this.getDefault(),
      type: this.question.type,
      options: this.options,
      value: await this.getValue(),
    };
  }

  async getValue() {
    const customUserFieldData = new CustomUserFieldDatas();
    const cufData = (
      await customUserFieldData.query({
        where: [
          { custom_user_field_id: this.customUserField.id },
          { profile_id: this.testerId },
        ],
      })
    )
      .map((o) => parseInt(o.value))
      .filter((o) => !isNaN(o))
      .filter((o) => this.options.includes(o));

    if (cufData.length === 0) return undefined;

    if (this.customUserField.type === "select") {
      return cufData[0];
    } else if (this.customUserField.type === "multiselect") {
      return cufData;
    }
    return undefined;
  }

  async isDataInsertable({
    campaignId,
    data,
  }: {
    campaignId: number;
    data: { question: number; value: { id: number; serialized: string } };
  }): Promise<boolean> {
    if (this.options.length === 0) return true;
    return this.options.includes(data.value.id);
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

export default CufSelectQuestion;
