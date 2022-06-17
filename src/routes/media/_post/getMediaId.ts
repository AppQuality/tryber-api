import crypto from "crypto";

function getMediaId(name: string): string {
  return crypto
    .createHash("md5")
    .update(name + new Date().getTime().toString())
    .digest("hex");
}

export default getMediaId;
