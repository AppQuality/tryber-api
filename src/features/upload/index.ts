import { S3 } from "aws-sdk";
import stream from "stream";

type UploadParams = {
  bucket: string;
  key: string;
  file: Media;
  style?: "path";
};

export default async ({
  bucket,
  key,
  file,
  style,
}: UploadParams): Promise<string> => {
  const awsCredentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
  const s3 = new S3({
    ...awsCredentials,
    ...(style === "path" ? { s3ForcePathStyle: true } : {}),
  });
  const pass = new stream.PassThrough();

  const promise = s3
    .upload({
      Bucket: bucket,
      Key: key,
      Body: pass,
      ContentType: file.mimeType,
    })
    .promise();
  file.stream.pipe(pass);
  const data = await promise;

  return data.Location; // returns the url location
};
