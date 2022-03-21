import {
  data as wpOptionsData,
  table as wpOptionsTable,
} from "@src/__mocks__/mockedDb/wp_options";

import getCrowdOption from ".";

jest.mock("@src/features/db");

describe("getCrowdOption", () => {
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      wpOptionsTable.create();
      wpOptionsData.crowdWpOptions();
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      wpOptionsTable.drop();
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
  beforeAll(async () => {
    return new Promise(async (resolve) => {
      wpOptionsTable.create();
      resolve(null);
    });
  });
  afterAll(async () => {
    return new Promise(async (resolve) => {
      wpOptionsTable.drop();
      resolve(null);
    });
  });

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
