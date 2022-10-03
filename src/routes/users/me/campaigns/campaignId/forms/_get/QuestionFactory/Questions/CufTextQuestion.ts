import { CustomUserFieldObject } from "@src/features/db/class/CustomUserFields";
import CustomUserFieldData from "@src/features/db/class/CustomUserFieldData";
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
    const cufOptions = this.customUserField.options
      .split(";")
      .map((o) => o.trim());
    return {
      ...this.getDefault(),
      type: this.question.type,
      validation:
        cufOptions.length > 0
          ? {
              regex: cufOptions[0],
              error: cufOptions.length > 1 ? cufOptions[1] : undefined,
            }
          : undefined,
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
    if (cufDataItem.length === 0) return undefined;
    return cufDataItem[0].value;
  }
}

export default CufTextQuestion;
