import WpOptions from "@src/__mocks__/mockedDb/wp_options";
import getCrowdOption from ".";

jest.mock("@src/features/db");

describe("getCrowdOption", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      await WpOptions.crowdWpOptions();
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      await WpOptions.clear();
      resolve(null);
    });
  });

  it("Should return the correct value for minimum payout", async () => {
    const result = await getCrowdOption("minimum_payout");
    expect(result).toBe("2");
  });
  it("Should return false if the option does not exists", async () => {
    const result = await getCrowdOption("not_existing_option");
    expect(result).toBe(false);
  });
});

describe("getCrowdOption - database not populated", () => {
  it("Should throw an error", async () => {
    try {
      await getCrowdOption("minimum_payout");
      throw new Error("Should not reach this point");
    } catch (e) {
      expect((e as OpenapiError).message).toBe(
        "Option crowd_options_option_name not found"
      );
    }
  });
});
