import stringToUuid from ".";

const string =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque mollis ante massa, eu varius arcu tempor eget. Mauris malesuada fermentum turpis sed accumsan. Mauris non lectus sed mi faucibus rutrum. Duis elementum neque nec magna facilisis, non condimentum velit pulvinar. Nullam in leo sapien. Praesent in tincidunt est. Aliquam aliquam enim libero, at vestibulum odio ultricies eu. Proin in semper erat. Phasellus a euismod quam. Sed vehicula eu arcu sit amet lobortis. Sed euismod mollis eros a consectetur. In urna lectus, aliquet nec elit a, ultricies accumsan odio. Duis sed neque vel dui malesuada posuere sit amet ac enim. Pellentesque vehicula orci aliquet sapien condimentum tincidunt. Praesent vestibulum vulputate nibh ac ultricies.";
const string2 = string + ".";
const expectedUuid = "016f3662-2240-5e73-846a-68d252960784";

describe("stringToUuid", () => {
  it("Should return a uuid", async () => {
    try {
      const uuid = await stringToUuid(string);
      expect(uuid).toBe(expectedUuid);
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
  it("Slightly different string should not return the same uuid", async () => {
    try {
      const uuid1 = await stringToUuid(string);
      const uuid2 = await stringToUuid(string2);
      expect(uuid1).not.toBe(uuid2);
    } catch (err) {
      throw err;
    }
  });
});
