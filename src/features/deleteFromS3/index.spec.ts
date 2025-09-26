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
      "https://mediaconvert-encoder-staging-bucket.s3.eu-west-1.amazonaws.com/CP7634/UC41048/T11205/2a1abc22e6f1b6640048e6ea438e580cbaa8f70b2d192a825892fddfb26499c9.jpg";
    const { bucket, key } = decomposeS3Url(url);
    expect(bucket).toBe("mediaconvert-encoder-staging-bucket");
    expect(key).toBe(
      "CP7634/UC41048/T11205/2a1abc22e6f1b6640048e6ea438e580cbaa8f70b2d192a825892fddfb26499c9.jpg"
    );
  });
});
