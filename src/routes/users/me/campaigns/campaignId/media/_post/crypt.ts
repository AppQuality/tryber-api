import crypto from "crypto";
export default function crypt(string: string): string {
  return crypto.createHash("sha256").update(string).digest("hex");
}
