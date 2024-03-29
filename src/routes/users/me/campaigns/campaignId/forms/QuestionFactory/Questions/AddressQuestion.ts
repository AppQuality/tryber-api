import Question from ".";
import Profile, { ProfileObject } from "@src/features/db/class/Profile";
import PreselectionFormData from "@src/features/db/class/PreselectionFormData";

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

  async insertData({
    campaignId,
    data,
  }: {
    campaignId: number;
    data: {
      question: number;
      value: {
        serialized: {
          city: ProfileObject["city"];
          country: ProfileObject["country"];
        };
      };
    };
  }): Promise<void> {
    const preselectionFormData = new PreselectionFormData();
    await preselectionFormData.insert({
      campaign_id: campaignId,
      field_id: data.question,
      tester_id: this.testerId,
      value: data.value.serialized.city + ", " + data.value.serialized.country,
    });
    await this.updateAddress(data.value.serialized);
  }
  async updateAddress(address: {
    city: ProfileObject["city"];
    country: ProfileObject["country"];
  }) {
    const profile = new Profile();
    profile.update({
      data: { city: address.city, country: address.country },
      where: [{ id: this.testerId }],
    });
  }
}

export default AddressQuestion;
