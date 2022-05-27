import { S3 } from "aws-sdk";
import { parse } from "url";

const decomposeS3Url = (url: string): { bucket: string; key: string } => {
  const { path } = parse(url);
  const [, bucket, key] = (path || "").match(/\/(.*?)\/(.*?)\/?$/) || [];
  return { bucket, key };
};

export default async ({ url }: { url: string }) => {
  const { bucket, key } = decomposeS3Url(url);
  const awsCredentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
  const s3 = new S3(awsCredentials);
  return await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
};

export { decomposeS3Url };
