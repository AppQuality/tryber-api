import { HttpRequest } from "@aws-sdk/protocol-http";
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { parseUrl } from "@aws-sdk/url-parser";
import { Hash } from "@aws-sdk/hash-node";
import { formatUrl } from "@aws-sdk/util-format-url";

// default expiration is 20 minutes (1200 seconds)
export const getPresignedUrl = async (
  url: string,
  expirationSeconds: number = 1200
): Promise<string> => {
  const s3ObjectUrl = parseUrl(url);
  const presigner = new S3RequestPresigner({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    region: "eu-west-1",
    sha256: Hash.bind(null, "sha256"), // In Node.js
  });
  // Create a GET request from S3 url.
  const presignedUrl = await presigner.presign(new HttpRequest(s3ObjectUrl), {
    expiresIn: expirationSeconds,
  });
  return formatUrl(presignedUrl);
};
