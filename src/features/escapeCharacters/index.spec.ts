import escapeCharacters from ".";

describe("escapeCharacters", () => {
  it("should escape characters", () => {
    const result = escapeCharacters(
      "string with 'special' (characters)<script>call()</script>"
    );
    expect(result).toBe("string with 'special' (characters)scriptcall()script");
  });
});
