import Question from ".";
import CustomUserFieldDatas from "@src/features/db/class/CustomUserFieldData";
import { CustomUserFieldExtrasObject } from "@src/features/db/class/CustomUserFieldExtras";
import { CustomUserFieldObject } from "@src/features/db/class/CustomUserFields";
import PreselectionFormData from "@src/features/db/class/PreselectionFormData";

class CufMultiselectQuestion extends Question<{
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
    question: typeof CufMultiselectQuestion.constructor.arguments[0];
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
      .map((o) => (typeof o.value === "string" ? parseInt(o.value) : o.value))
      .filter((o) => !isNaN(o))
      .filter((o) => this.options.includes(o));

    if (cufData.length === 0) return undefined;

    return cufData;
  }

  async isDataInsertable({
    campaignId,
    data,
  }: {
    campaignId: number;
    data: {
      question: number;
      value: { id: number[]; serialized: string | string[] };
    };
  }): Promise<boolean> {
    if (this.options.length === 0) return true;

    for (const id of data.value.id) {
      if (!this.options.includes(id)) return false;
    }
    return true;
  }

  async insertData({
    campaignId,
    data,
  }: {
    campaignId: number;
    data: {
      question: number;
      value: { id: number[]; serialized: string | string[] };
    };
  }): Promise<void> {
    const preselectionFormData = new PreselectionFormData();

    for (const value of data.value.serialized) {
      await preselectionFormData.insert({
        campaign_id: campaignId,
        field_id: data.question,
        value,
      });
      await this.updateCuf(data.value.id);
    }
  }

  private async updateCuf(value: number[]) {
    const customUserFieldData = new CustomUserFieldDatas();
    const oldValue = await this.getValue();

    if (oldValue) {
      for (const validOption of this.options) {
        await customUserFieldData.delete([
          { custom_user_field_id: this.customUserField.id },
          { profile_id: this.testerId },
          { value: validOption },
        ]);
      }
      for (const v of value) {
        await customUserFieldData.insert({
          custom_user_field_id: this.customUserField.id,
          profile_id: this.testerId,
          value: v,
        });
      }
    } else {
      for (const validOption of this.options) {
        await customUserFieldData.delete([
          { custom_user_field_id: this.customUserField.id },
          { profile_id: this.testerId },
          { value: validOption },
        ]);
      }
      for (const v of value) {
        await customUserFieldData.insert({
          custom_user_field_id: this.customUserField.id,
          profile_id: this.testerId,
          value: v,
        });
      }
    }
  }
}

export default CufMultiselectQuestion;
