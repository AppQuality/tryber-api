import Question from ".";

class PhoneQuestion extends Question<{
  type: `phone_number`;
}> {
  constructor(question: typeof PhoneQuestion.constructor.arguments[0]) {
    super(question);
  }
  async getItem(): Promise<{
    id: number;
    type: string;
    question: string;
    validation?: { regex: string };
  }> {
    return {
      ...this.getDefault(),
      type: this.question.type,
      validation: {
        regex: "^\\+?[0-9]{12,14}$",
      },
    };
  }
}

export default PhoneQuestion;
