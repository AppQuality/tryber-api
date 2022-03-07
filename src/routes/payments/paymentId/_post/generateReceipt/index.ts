import AWS from "aws-sdk";

export default (id: number) => {
  // publish to SNS
  const sns = new AWS.SNS({
    apiVersion: "2010-03-31",
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });
  const params = {
    Message: id.toString(),
    TopicArn: process.env.RECEIPT_GENERATE_SNS_ARN,
  };
  sns.publish(params, (err, data) => {
    if (err) {
      console.error(err);
    }
    console.log(data);
  });
};
