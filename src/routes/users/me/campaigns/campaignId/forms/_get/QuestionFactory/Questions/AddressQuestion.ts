import Question from ".";
import Profile, { ProfileObject } from "@src/features/db/class/Profile";

class AddressQuestion extends Question<{
  type: `address`;
}> {
  constructor(
    question: typeof AddressQuestion.constructor.arguments[0],
    private testerId: number
  ) {
    super(question);
  }
  async getItem(): Promise<{
    id: number;
    type: string;
    question: string;
    validation?: { regex: string };
    value?: {
      country: ProfileObject["country"];
      city: ProfileObject["city"];
    };
  }> {
    return {
      ...this.getDefault(),
      type: this.question.type,
      validation: {
        regex: "^\\+?[0-9]{12,14}$",
      },
      value: await this.getAddress(),
    };
  }

  async getAddress() {
    const profile = new Profile();
    try {
      const tester = await profile.get(this.testerId);
      if (tester.country) {
        return {
          country: tester.country,
          city: tester.city ? tester.city : undefined,
        };
      }
    } catch (e) {}
    return undefined;
  }
}

export default AddressQuestion;
