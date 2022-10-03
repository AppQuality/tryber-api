import Question from ".";
import Profile, { ProfileObject } from "@src/features/db/class/Profile";

class GenderQuestion extends Question<{
  type: `gender`;
}> {
  private testerId: number;
  constructor(
    question: typeof GenderQuestion.constructor.arguments[0],
    testerId: number
  ) {
    super(question);
    this.testerId = testerId;
  }
  async getItem(): Promise<{
    id: number;
    type: string;
    question: string;
    value?: ProfileObject["gender"];
  }> {
    return {
      ...this.getDefault(),
      value: await this.getGender(),
    };
  }

  async getGender() {
    const profile = new Profile();
    try {
      const tester = await profile.get(this.testerId);
      if (tester.gender) {
        return tester.gender;
      }
    } catch (e) {}
    return undefined;
  }
}

export default GenderQuestion;
