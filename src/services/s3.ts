import { S3 } from "@aws-sdk/client-s3";

const client = new S3({
  endpoint: process.env.S3_URL,
  credentials: {
    accessKeyId: process.env.S3_ACCESS ?? "",
    secretAccessKey: process.env.S3_SECRET ?? "",
  },
  region: process.env.S3_REGION,
  forcePathStyle: true,
});

export const uploadFile = async (name: string, file: File) => {
  return client.putObject({
    Bucket: process.env.S3_BUCKET,
    Body: Buffer.from(await file.arrayBuffer()),
    Key: name,
  });
};
