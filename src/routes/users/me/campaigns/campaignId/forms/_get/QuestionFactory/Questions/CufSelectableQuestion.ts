import Question from ".";
import { CustomUserFieldExtrasObject } from "@src/features/db/class/CustomUserFieldExtras";

class CufSelectQuestion extends Question<{
  type: `cuf_${number}`;
}> {
  constructor(
    question: typeof CufSelectQuestion.constructor.arguments[0],
    private options: CustomUserFieldExtrasObject[]
  ) {
    super(question);
  }
  getItem(): {
    id: number;
    type: string;
    question: string;
    options: number[];
  } {
    const validOptions = this.question.options
      .split(",")
      .map((o) => parseInt(o.trim()));
    const options = this.options
      .filter((o) => validOptions.includes(o.id))
      .map((o) => o.id);

    return {
      ...this.getDefault(),
      type: this.question.type,
      options,
    };
  }
}

export default CufSelectQuestion;
