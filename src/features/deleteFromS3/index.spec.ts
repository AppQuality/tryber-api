import "jest";
import { decomposeS3Url } from ".";

describe("Decompose s3 url", () => {
  it("Should return bucket and key", () => {
    const url =
      "https://s3.eu-west-1.amazonaws.com/tryber.assets.static/media/T11205/txt_1653662342424.json";
    const { bucket, key } = decomposeS3Url(url);
    expect(bucket).toBe("tryber.assets.static");
    expect(key).toBe("media/T11205/txt_1653662342424.json");
  });
});
