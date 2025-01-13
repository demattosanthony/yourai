import { S3Client } from "bun";

const s3 = new S3Client({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  endpoint: process.env.S3_ENDPOINT_URL,
  bucket: process.env.S3_BUCKET_NAME,
  region: process.env.S3_REGION,
});

export default s3;
