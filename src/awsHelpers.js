
import { DynamoDBClient,
         DeleteItemCommand } from "@aws-sdk/client-dynamodb"
import { ScanCommand,
         PutCommand,
        DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { CreateBucketCommand,
         DeleteObjectsCommand, 
         DeleteBucketCommand,
         ListObjectsV2Command, 
         S3Client } from "@aws-sdk/client-s3";
import { EC2Client, 
         DescribeRegionsCommand } from "@aws-sdk/client-ec2"
import crypto from "crypto"

export const createS3 = async (bucketName, region) => {
  const client = new S3Client({ region: region });
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

export const getProjectFromDynamo = async (projectName, region) => {
  const dynamoDbClient = new DynamoDBClient({region: region });
  const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

  const command = new ScanCommand({
    TableName: "backend_info",
    FilterExpression: `#name = :projectName`,
    ExpressionAttributeNames: { "#name": "name" },
    ExpressionAttributeValues: { ":projectName": `${projectName}`}
  });

  const response = await docClient.send(command)
  return response.Items[0]
}

export const getAllProjects = async (region) => {
  const dynamoDbClient = new DynamoDBClient({region: region });
  const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

  const command = new ScanCommand({
    TableName: "backend_info",
  });

  const response = await docClient.send(command);
  return response.Items
}

export const addProjectToDynamo = async (projectName, backendEndpoint, region, apiToken, jwtSecret, pgUsername, pgPassword) => {
  const dynamoDbClient = new DynamoDBClient({region: region });
  const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

  const command = new PutCommand({
    TableName: "backend_info",
    Item: {
      id: crypto.randomBytes(12).toString("hex"),
      name: projectName,
      endpoint: backendEndpoint,
      region: region,
      apiToken: apiToken,
      jwtSecret: jwtSecret,
      pgUsername: pgUsername,
      pgPassword: pgPassword,
    }
  })
  const response = await docClient.send(command);
  return response;
}

export const removeProjectFromDynamo = async (name, region) => {
  const dynamoDbClient = new DynamoDBClient({region: region });
  const project = await getProjectFromDynamo(name, region);
  console.log(project)

  try {
    const command = new DeleteItemCommand({
      TableName: "backend_info",
      Key: {
        "id": { "S" : project.id }
      }
    });

    const data = await dynamoDbClient.send(command);
    console.log('Item deleted successfully:', data);
} catch (err) {
  console.error(err);
  }
}

export const emptyS3 = async (bucket, region) => {
  const client = new S3Client({ region: region});

  try {
    const listObjectsResponse = await client.send(new ListObjectsV2Command({ Bucket: bucket }));
    const objectsToDelete = listObjectsResponse.Contents.map(obj => ({ Key: obj.Key }));
    console.log("listObjectsResponse: ", listObjectsResponse)
    console.log("Objectstodelete: ", objectsToDelete);
    await client.send(new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: objectsToDelete },
    }));
  } catch (error) {
    console.error('Error deleting objects from S3:', error);
  }
}

export const removeS3 = async (bucket, region) => {
  const client = new S3Client({ region: region });
  const command = new DeleteBucketCommand({
    Bucket: bucket,
  });

  try {
    const response = await client.send(command);
    console.log(response);
  } catch (err) {
    console.error(err);
  }
}


export const getAWSRegions = async () => {
  const ec2Client = new EC2Client({ region: "us-west-2" });
  try {
    const command = new DescribeRegionsCommand({});
    const data = await ec2Client.send(command);
    const regions = data.Regions.map(region => region.RegionName);
    return regions;
  } catch (err) {
    console.error('Error describing regions:', err);
    throw err;
  }
}

