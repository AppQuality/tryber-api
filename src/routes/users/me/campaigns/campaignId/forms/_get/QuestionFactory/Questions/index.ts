import PreselectionFormFields from "@src/features/db/class/PreselectionFormFields";

class Question<T> {
  constructor(
    protected question: Awaited<
      ReturnType<PreselectionFormFields["query"]>
    >[number] &
      T
  ) {}

  getDefault() {
    return {
      id: this.question.id,
      type: this.question.type,
      question: this.question.question,
    };
  }
  async getItem(): Promise<{ id: number; type: string; question: string }> {
    return {
      ...this.getDefault(),
    };
  }
}

export default Question;
