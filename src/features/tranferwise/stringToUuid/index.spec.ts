import stringToUuid from ".";

const string = "Hello World";
const resultUuid = "48656c6c-f576-426c-4486-6c6c6f576f72";

describe("stringToUuid", () => {
  it("Should return a uuid", async () => {
    try {
      const uuid = await stringToUuid(string);
      expect(uuid.length).toBe(36);
      const uuidArray = uuid.split("-");
      expect(uuidArray.length).toBe(5);
      expect(uuidArray[0].length).toBe(8);
      expect(uuidArray[1].length).toBe(4);
      expect(uuidArray[2].length).toBe(4);
      expect(uuidArray[3].length).toBe(4);
      expect(uuidArray[4].length).toBe(12);
    } catch (err) {
      throw err;
    }
  });
});
