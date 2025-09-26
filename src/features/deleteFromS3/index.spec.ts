import "jest";
import { decomposeS3Url } from ".";

describe("Decompose s3 url", () => {
  it("Should return bucket and key", () => {
    const url =
      "https://s3-eu-west-1.amazonaws.com/mediaconvert.bucket/CP7634/UC41048/T11205/3ff2c0c2f7a2084afe1e0c5c7541b3dabfb0c0cf1df2e71b593e07ed7f260808.mp4";
    const { bucket, key } = decomposeS3Url(url);
    expect(bucket).toBe("mediaconvert.bucket");
    expect(key).toBe(
      "CP7634/UC41048/T11205/3ff2c0c2f7a2084afe1e0c5c7541b3dabfb0c0cf1df2e71b593e07ed7f260808.mp4"
    );
  });
  it("Should return bucket and key", () => {
    const url =
      "https://s3.eu-west-1.amazonaws.com/mediaconvert.bucket/CP7634/UC41048/T11205/3ff2c0c2f7a2084afe1e0c5c7541b3dabfb0c0cf1df2e71b593e07ed7f260808.mp4";
    const { bucket, key } = decomposeS3Url(url);
    expect(bucket).toBe("mediaconvert.bucket");
    expect(key).toBe(
      "CP7634/UC41048/T11205/3ff2c0c2f7a2084afe1e0c5c7541b3dabfb0c0cf1df2e71b593e07ed7f260808.mp4"
    );
  });
});
