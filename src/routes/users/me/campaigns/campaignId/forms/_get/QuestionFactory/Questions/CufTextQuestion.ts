import Question from ".";

class CufTextQuestion extends Question<{
  type: `cuf_${number}`;
}> {
  constructor(
    question: typeof CufTextQuestion.constructor.arguments[0],
    private options: string
  ) {
    super(question);
  }
  getItem(): {
    id: number;
    type: string;
    question: string;
    validation?: { regex: string; error?: string };
  } {
    const cufOptions = this.options.split(";").map((o) => o.trim());
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
    };
  }
}

export default CufTextQuestion;
