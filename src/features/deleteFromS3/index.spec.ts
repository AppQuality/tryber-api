import "jest";
import { decomposeS3Url } from ".";

describe("Decompose s3 url", () => {
  it("Should return bucket and key", () => {
    const url =
      "https://s3.eu-west-1.amazonaws.com/media.bucket/media/T11205/txt 1653662342424.json";
    const { bucket, key } = decomposeS3Url(url);
    expect(bucket).toBe("media.bucket");
    expect(key).toBe("media/T11205/txt 1653662342424.json");
  });

  it("Should return empty bucket and key for invalid url", () => {
    const url =
      "https://mediaconvert-encoder-staging-bucket-origin.s3.eu-west-1.amazonaws.com/CP7634/UC41048/T11205/6055f5d549030c58337ec5fc119c6b59cdf4576fb36eb7911336309e710a1deb.mp4";
    const { bucket, key } = decomposeS3Url(url);
    expect(bucket).toBe("mediaconvert-encoder-staging-bucket-origin");
    expect(key).toBe(
      "CP7634/UC41048/T11205/6055f5d549030c58337ec5fc119c6b59cdf4576fb36eb7911336309e710a1deb.mp4"
    );
  });
});
