
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb"
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fs from "fs";
import { fileURLToPath } from 'url';
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dynamoDbClient = new DynamoDBClient({region: "us-east-1"});
const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

const getS3Info = async () => {
  const client = new DynamoDBClient({});
  const command = new GetItemCommand({
    TableName: "backend_info",
    Key: {
      id: {S: "bucket_name"}
    }
  });

  const response = await client.send(command);
  return response.Item.name.S;
}

export const saveS3InfoToDynamo = async (bucketName) => {
  const command = new PutCommand({
    TableName: "backend_info",
    Item: {
      id: "bucket_name",
      name: bucketName
    }
  })
  const response = await docClient.send(command);
  console.log(response);
  return response;
}

export const saveTFStateToS3 = async () => {
  const terraformDir = path.join(__dirname, "terraform");
  const client = new S3Client({})
  const S3BucketName = await getS3Info();
  const command = new PutObjectCommand({
    Bucket: S3BucketName,
    Key: "terraform.tfstate",
    Body: fs.readFileSync(`${terraformDir}/terraform.tfstate`),
    ContentType: "application/json"
  })

  try {
    const response = await client.send(command);
    console.log("response: ", response);
  } catch (err) {
    console.error(err);
  }
}

let obj = {
  "format_version": "1.0",
  "terraform_version": "1.5.7",
  "values": {
    "root_module": {
      "resources": [
        {
          "address": "aws_dynamodb_table.db",
          "mode": "managed",
          "type": "aws_dynamodb_table",
          "name": "db",
          "provider_name": "registry.terraform.io/hashicorp/aws",
          "schema_version": 1,
          "values": {
            "arn": "arn:aws:dynamodb:us-east-1:957782188320:table/backend_info",
            "attribute": [
              {
                "name": "id",
                "type": "S"
              }
            ],
            "billing_mode": "PAY_PER_REQUEST",
            "deletion_protection_enabled": false,
            "global_secondary_index": [],
            "hash_key": "id",
            "id": "backend_info",
            "import_table": [],
            "local_secondary_index": [],
            "name": "backend_info",
            "point_in_time_recovery": [
              {
                "enabled": false
              }
            ],
            "range_key": null,
            "read_capacity": 0,
            "replica": [],
            "restore_date_time": null,
            "restore_source_name": null,
            "restore_to_latest_time": null,
            "server_side_encryption": [],
            "stream_arn": "",
            "stream_enabled": false,
            "stream_label": "",
            "stream_view_type": "",
            "table_class": "STANDARD_INFREQUENT_ACCESS",
            "tags": null,
            "tags_all": {},
            "timeouts": null,
            "ttl": [
              {
                "attribute_name": "",
                "enabled": false
              }
            ],
            "write_capacity": 0
          },
          "sensitive_values": {
            "attribute": [
              {}
            ],
            "global_secondary_index": [],
            "import_table": [],
            "local_secondary_index": [],
            "point_in_time_recovery": [
              {}
            ],
            "replica": [],
            "server_side_encryption": [],
            "tags_all": {},
            "ttl": [
              {}
            ]
          }
        },
        {
          "address": "aws_s3_bucket.bucket",
          "mode": "managed",
          "type": "aws_s3_bucket",
          "name": "bucket",
          "provider_name": "registry.terraform.io/hashicorp/aws",
          "schema_version": 0,
          "values": {
            "acceleration_status": "",
            "acl": null,
            "arn": "arn:aws:s3:::terraform-20240320182609762300000001",
            "bucket": "terraform-20240320182609762300000001",
            "bucket_domain_name": "terraform-20240320182609762300000001.s3.amazonaws.com",
            "bucket_prefix": "terraform-",
            "bucket_regional_domain_name": "terraform-20240320182609762300000001.s3.us-east-1.amazonaws.com",
            "cors_rule": [],
            "force_destroy": false,
            "grant": [
              {
                "id": "8536801801e502c5e67e8765b414aeaa124be28594fe5e42cf796a8c5f5ccf1d",
                "permissions": [
                  "FULL_CONTROL"
                ],
                "type": "CanonicalUser",
                "uri": ""
              }
            ],
            "hosted_zone_id": "Z3AQBSTGFYJSTF",
            "id": "terraform-20240320182609762300000001",
            "lifecycle_rule": [],
            "logging": [],
            "object_lock_configuration": [],
            "object_lock_enabled": false,
            "policy": "",
            "region": "us-east-1",
            "replication_configuration": [],
            "request_payer": "BucketOwner",
            "server_side_encryption_configuration": [
              {
                "rule": [
                  {
                    "apply_server_side_encryption_by_default": [
                      {
                        "kms_master_key_id": "",
                        "sse_algorithm": "AES256"
                      }
                    ],
                    "bucket_key_enabled": false
                  }
                ]
              }
            ],
            "tags": {},
            "tags_all": {},
            "timeouts": null,
            "versioning": [
              {
                "enabled": false,
                "mfa_delete": false
              }
            ],
            "website": [],
            "website_domain": null,
            "website_endpoint": null
          },
          "sensitive_values": {
            "cors_rule": [],
            "grant": [
              {
                "permissions": [
                  false
                ]
              }
            ],
            "lifecycle_rule": [],
            "logging": [],
            "object_lock_configuration": [],
            "replication_configuration": [],
            "server_side_encryption_configuration": [
              {
                "rule": [
                  {
                    "apply_server_side_encryption_by_default": [
                      {}
                    ]
                  }
                ]
              }
            ],
            "tags": {},
            "tags_all": {},
            "versioning": [
              {}
            ],
            "website": []
          }
        }
      ]
    }
  }
}

console.log(obj.values.root_module.resources[1].values.bucket)