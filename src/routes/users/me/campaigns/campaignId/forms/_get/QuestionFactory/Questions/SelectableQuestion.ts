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
      options: JSON.parse(this.question.options).map((o: string) => o.trim()),
    };
  }
}

export default SelectableQuestion;
