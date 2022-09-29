import Question from ".";

class SelectableQuestion extends Question<{
  type: "select" | "multiselect" | "radio";
}> {
  async getItem(): Promise<{
    id: number;
    type: string;
    question: string;
    options: string[];
  }> {
    return {
      ...this.getDefault(),
      options: this.question.options.split(",").map((o) => o.trim()),
    };
  }
}

export default SelectableQuestion;
