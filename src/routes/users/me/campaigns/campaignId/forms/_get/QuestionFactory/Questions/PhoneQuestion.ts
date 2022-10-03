import Question from ".";
import Profile, { ProfileObject } from "@src/features/db/class/Profile";

class PhoneQuestion extends Question<{
  type: `phone_number`;
}> {
  constructor(
    question: typeof PhoneQuestion.constructor.arguments[0],
    private testerId: number
  ) {
    super(question);
  }
  async getItem(): Promise<{
    id: number;
    type: string;
    question: string;
    validation?: { regex: string };
    value?: ProfileObject["phone_number"];
  }> {
    return {
      ...this.getDefault(),
      type: this.question.type,
      validation: {
        regex: "^\\+?[0-9]{12,14}$",
      },
      value: await this.getPhone(),
    };
  }

  async getPhone() {
    const profile = new Profile();
    try {
      const tester = await profile.get(this.testerId);
      if (tester.phone_number) {
        return tester.phone_number;
      }
    } catch (e) {}
    return undefined;
  }
}

export default PhoneQuestion;
