
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { ScanCommand, PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { CreateBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { fileURLToPath } from 'url';
import path from "path";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dynamoDbClient = new DynamoDBClient({region: "us-west-2"});
const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

export const createS3 = async (bucketName) => {
  const client = new S3Client({ region: "us-west-2"});
  const command = new CreateBucketCommand({
    Bucket: bucketName,
  });

  try {
    const { Location } = await client.send(command);
    return Location;
  } catch (err) {
    console.error(err);
  }
}

export const getS3Info = async () => {
  const command = new ScanCommand({
    FilterExpression: "#purpose = :bucket_name",
    ExpressionAttributeNames: { "#purpose": "purpose" },
    ExpressionAttributeValues: {":bucket_name": "bucket_name"},
    TableName: "backend_info",
  });

  const response = await docClient.send(command)
  return response.Items[0].name;
}

export const getLBEndpoint = async (projectName) => {
  const command = new ScanCommand({
    TableName: "backend_info",
    FilterExpression: `#name = :projectName`,
    ExpressionAttributeNames: { "#name": "name" },
    ExpressionAttributeValues: { ":projectName": `${projectName}`}
  });

  const response = await docClient.send(command)
  return response.Items[0].endpoint
}

export const addEndpointToDynamo = async (projectName, backendEndpoint) => {
  const command = new PutCommand({
    TableName: "backend_info",
    Item: {
      id: crypto.randomBytes(12).toString("hex"),
      name: projectName,
      endpoint: backendEndpoint
    }
  })
  const response = await docClient.send(command);
  console.log(response);
  return response;
}

