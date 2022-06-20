import AWS from "aws-sdk";

import upload from ".";

jest.mock("aws-sdk", () => {
  let instance = {
    upload: jest.fn().mockReturnThis(),
    promise: jest.fn(),
  };
  return { S3: jest.fn(() => instance) };
});
const mockedS3: any = new AWS.S3();
describe("Upload to S3", () => {
  beforeAll(() => {
    mockedS3.promise.mockReturnValueOnce({
      Bucket: "TestBucketName",
      location: "https://testbucketname.s3.amazonaws.com/test.jpg",
    });
  });
  it("should upload a file to S3 with correct mimetype", async () => {
    const file = {
      name: "test.txt",
      encoding: "7bit",
      mimetype: "text/plain",
      size: 12,
      md5: "d41d8cd98f00b204e9800998ecf8427e",
      truncated: false,
      data: Buffer.from(""),
      tempFilePath: "",
      mv: jest.fn(),
    };
    const result = await upload({
      bucket: "",
      key: "",
      file: file,
    });
    expect(mockedS3.upload).toBeCalledWith({
      ACL: "public-read",
      Body: Buffer.from(""),
      Bucket: "",
      Key: "",
      ContentType: "text/plain",
    });
  });
});
