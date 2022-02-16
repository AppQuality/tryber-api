import crypto from "crypto";
import fs from "fs";

export default (str: string): Promise<string> => {
  const sign = crypto.createSign("SHA256");
  sign.write(str);
  sign.end();

  const key = fs.readFileSync("./keys/private_tw.pem");
  const signature_b64 = sign.sign(key, "base64");
  return Promise.resolve(signature_b64);
};
