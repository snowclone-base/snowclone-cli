import crypto from "crypto";

export function nameS3() {
  const s3BucketName = "snowclone-" + crypto.randomBytes(4).toString("hex");
  return s3BucketName;
}

export function generateHash(charLength) {
  const bytes = charLength / 2;
  return crypto.randomBytes(bytes).toString("hex");
}
