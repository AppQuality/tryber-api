import PreselectionFormData from "@src/features/db/class/PreselectionFormData";
import Question from ".";

class SelectableQuestion extends Question<{
  type: "select" | "multiselect" | "radio";
}> {
  constructor(
    question: typeof SelectableQuestion.constructor.arguments[0],
    private testerId: number
  ) {
    super(question);
  }

  async getItem(): Promise<{
    id: number;
    type: string;
    question: string;
    options: string[];
  }> {
    return {
      ...this.getDefault(),
      options: this.getOptions(),
    };
  }

  private getOptions() {
    return SelectableQuestion.unserialize(this.question.options);
  }

  private static unserialize(value: string) {
    return JSON.parse(value).map((o: string) => o.trim());
  }

  async isDataInsertable({
    campaignId,
    data,
  }: {
    campaignId: number;
    data: { question: number; value: { serialized: string } };
  }): Promise<boolean> {
    if (this.isSingle()) {
      return this.isSingleDataInsertable(data.value.serialized);
    }
    if (this.isMultiple()) {
      return this.isMultipleDataInsertable(data.value.serialized);
    }
    return false;
  }

  private isSingleDataInsertable(value: string) {
    return this.getOptions().includes(value);
  }
  private isMultipleDataInsertable(value: string) {
    for (const v of value) {
      if (!this.getOptions().includes(v)) {
        return false;
      }
    }
    return true;
  }

  async insertData({
    campaignId,
    data,
  }: {
    campaignId: number;
    data: { question: number; value: { serialized: string } };
  }): Promise<void> {
    const preselectionFormData = new PreselectionFormData();
    if (this.isSingle()) {
      await preselectionFormData.insert({
        campaign_id: campaignId,
        field_id: data.question,
        tester_id: this.testerId,
        value: data.value.serialized,
      });
      return;
    }
    if (this.isMultiple()) {
      for (const value of data.value.serialized) {
        await preselectionFormData.insert({
          campaign_id: campaignId,
          field_id: data.question,
          tester_id: this.testerId,
          value,
        });
      }
      return;
    }
  }

  private isSingle() {
    return this.question.type === "select" || this.question.type === "radio";
  }

  private isMultiple() {
    return this.question.type === "multiselect";
  }

  async isScreenedOut(item: { data: any }) {
    if (!this.question.invalid_options) return false;
    if (this.isSingle()) {
      return this.isSingleScreenedOut(item.data);
    } else if (this.isMultiple()) {
      return this.isMultipleScreenedOut(item.data);
    }
    return false;
  }

  private isSingleScreenedOut(data: any) {
    const value = data.value.serialized;
    return this.question.invalid_options.includes(value);
  }

  private isMultipleScreenedOut(data: any) {
    const value = data.value.serialized;
    for (const v of value) {
      if (this.question.invalid_options.includes(v)) {
        return true;
      }
    }

    return false;
  }
}

export default SelectableQuestion;
