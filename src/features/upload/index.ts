import { S3 } from "aws-sdk";
import { UploadedFile } from "express-fileupload";

type UploadParams = {
  bucket: string;
  key: string;
  file: UploadedFile;
};

export default async ({ bucket, key, file }: UploadParams): Promise<string> => {
  const awsCredentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
  const s3 = new S3(awsCredentials);

  const data = await s3
    .upload({
      Bucket: bucket,
      Key: key,
      Body: file.data,
      ACL: "public-read",
    })
    .promise();
  return data.Location; // returns the url location
};
