import { S3Client } from "bun";

const client = new S3Client({
  accessKeyId: "minioadmin",
  secretAccessKey: "minioadmin123",
  endpoint: "http://localhost:9000",
  bucket: "my-new-bucket",
});

export default client;
