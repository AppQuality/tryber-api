import Question from ".";
import CustomUserFieldDatas from "@src/features/db/class/CustomUserFieldData";
import { CustomUserFieldExtrasObject } from "@src/features/db/class/CustomUserFieldExtras";
import { CustomUserFieldObject } from "@src/features/db/class/CustomUserFields";
import PreselectionFormData from "@src/features/db/class/PreselectionFormData";
import * as db from "@src/features/db";

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
    if (this.options.length === 0 || this.isNoneOfTheAbove(data.value.id))
      return true;

    for (const id of data.value.id) {
      if (!this.options.includes(id)) return false;
    }
    return true;
  }

  isNoneOfTheAbove(ids: number[]) {
    return ids.includes(-1);
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
    if (this.isNoneOfTheAbove(data.value.id)) {
      await preselectionFormData.insert({
        campaign_id: campaignId,
        field_id: data.question,
        tester_id: this.testerId,
        value: "#",
      });
    } else {
      for (const value of data.value.serialized) {
        await preselectionFormData.insert({
          campaign_id: campaignId,
          field_id: data.question,
          tester_id: this.testerId,
          value,
        });
      }
    }
    await this.updateCuf(data.value.id);
  }

  private async updateCuf(value: number[]) {
    await this.removeAllValidOptions();
    if (this.isNoneOfTheAbove(value) === false) {
      await this.insertValues(value);
    }
  }

  private async insertValues(value: number[]) {
    const customUserFieldData = new CustomUserFieldDatas();
    for (const v of value) {
      await customUserFieldData.insert({
        custom_user_field_id: this.customUserField.id,
        profile_id: this.testerId,
        value: v,
      });
    }
  }

  private async removeAllValidOptions() {
    const options = this.options.filter((o) => o > 0);
    await db.query(
      db.format(
        `DELETE FROM wp_appq_custom_user_field_data 
    WHERE 
      custom_user_field_id = ? 
      AND profile_id = ?
      AND value IN (${options.join(",")})`,
        [this.customUserField.id, this.testerId]
      )
    );
  }
}

export default CufMultiselectQuestion;
