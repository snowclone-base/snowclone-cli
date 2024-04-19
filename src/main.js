import fs from "fs";
import path from "path";
import os from "os";
import { execSync, exec, spawn } from "child_process";
import { fileURLToPath } from 'url';
import crypto from "crypto";
import { addProjectToDynamo,
        getProjectFromDynamo,
        removeProjectFromDynamo, 
        createS3,
        getAllProjects,
        getAWSRegions,
        emptyS3,
        removeS3,
        dynamoDbExists } from "./utils/awsHelpers.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const homeDir = os.homedir();
const appDir = path.join(homeDir, "snowclone");
const terraformMainDir = path.join(__dirname, "terraform/instance");
const terraformAdminDir = path.join(__dirname, "terraform/admin");
const sqlDir = path.join(__dirname, "sql")

// save bucket name to users home directory in snowclone folder
function saveInfoForProjects(bucketName, region, domain, subnetAid, subnetBid, route53ZoneId) {
  const data = { bucketName, region, domain, subnetAid, subnetBid, route53ZoneId };
  fs.mkdirSync(appDir, { recursive: true });
  const fileName = path.join(appDir, "S3.json");

  fs.writeFile(fileName, JSON.stringify(data), (err) => {
    if (err) {
      console.error(err);
    }
  });
}

export async function terraformInit(bucketName, region, directory) {
  return new Promise((resolve, reject) => {
    exec(`terraform init -reconfigure \
    -backend-config="bucket=${bucketName}" \
    -backend-config="region=${region}" \
    -backend-config="key=terraform.tfstate"`,
      { cwd: directory },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Failed to initialize Terraform: ${stderr}`));
        } else {
          resolve(stdout);
        }
      }
    );
  })
  
}

function configureWorkspace(workspaceName, directory) {
  execSync(`terraform workspace select -or-create ${workspaceName}`, { encoding: "utf-8", cwd: directory });
}

function terraformApplyAdmin(configs, directory) {
  execSync(`terraform apply -auto-approve \
  -var="region=${configs.region}" -var="domain_name=${configs.domain}"`,
 { encoding: "utf-8", cwd: directory })
}

function terraformApply(projectName, region, directory, domainName, subnetAid, subnetBid, pgUsername, pgPassword, jwtSecret, apiToken, route53ZoneId) {
  execSync(
    `terraform apply -auto-approve  -var="project_name=${projectName}" \
     -var="domain_name=${domainName}" -var="region=${region}" \
     -var="private_subnet_a_id=${subnetAid}" -var="private_subnet_b_id=${subnetBid}" \
     -var="postgres_username=${pgUsername}" -var="postgres_password=${pgPassword}" \
     -var="api_token=${apiToken}" -var="jwt_secret=${jwtSecret}" \
     -var="aws_route53_zone_id=${route53ZoneId}"`,
    { encoding: "utf-8", cwd: directory }
  );
}



function terraformDestroy(projectName, region, directory, domainName, subnetAid, subnetBid, pgUsername, pgPassword, jwtSecret, apiToken, route53ZoneId) {
  execSync(
    `terraform destroy -auto-approve  -var="project_name=${projectName}" \
     -var="domain_name=${domainName}" -var="region=${region}" \
     -var="private_subnet_a_id=${subnetAid}" -var="private_subnet_b_id=${subnetBid}" \
     -var="postgres_username=${pgUsername}" -var="postgres_password=${pgPassword}" \
     -var="api_token=${apiToken}" -var="jwt_secret=${jwtSecret}" \
     -var="aws_route53_zone_id=${route53ZoneId}"`,
    { encoding: "utf-8", cwd: directory }
  );
}

async function isValidRegion(region) {
  const regions = await getAWSRegions();
  return regions.includes(region);
}

// get info from file we saved
export function getInfoForProjects() {
  const s3File = path.join(appDir, "S3.json");
  const data = fs.readFileSync(s3File, "utf8");
  return JSON.parse(data);
}

function addApiSchema(apiToken, projectName, domain) {
  const intervalId = setInterval(() => {
    const response = execSync(`curl -H "Authorization: Bearer ${apiToken}" -o /dev/null -w "%{http_code}" -F "file=@apiSchema.sql" https://${projectName}.${domain}/schema`, { encoding: "utf-8", cwd: sqlDir});
    const statusCode = parseInt(response.toString(), 10);
    if (statusCode === 201) {
      clearInterval(intervalId);
    }
  }, 5000);
}

// create S3 bucket, create admin infra and save state to the bucket. (deal w/ configs, change to try/ catch block later)
export async function initializeAdmin(configs) {
  const validRegion = await isValidRegion(configs.region);
  if (!validRegion) {
    console.log("Please enter a valid region");
    return;
  }

  const s3BucketName = "snowclone-" + crypto.randomBytes(6).toString("hex");


  await createS3(s3BucketName, configs.region);
  terraformInit(s3BucketName, configs.region, terraformAdminDir);
  configureWorkspace("admin", terraformAdminDir);
  
  terraformApplyAdmin(configs, terraformAdminDir);
  const tfOutputs = execSync("terraform output -json", {
    cwd: terraformAdminDir,
  }).toString();
  const subnetAid = JSON.parse(tfOutputs).private_subnet_a_id.value;
  const subnetBid = JSON.parse(tfOutputs).private_subnet_b_id.value;
  const route53ZoneId = JSON.parse(tfOutputs).aws_route53_zone_id.value
  saveInfoForProjects(s3BucketName, configs.region, configs.domain, subnetAid, subnetBid, route53ZoneId);
}

// provision backend, save endpoint to dynamo
export async function deployProject(configs) {
  const { bucketName, region, subnetAid, subnetBid, route53ZoneId, domain } = getInfoForProjects();
  
  try {
    terraformInit(bucketName, region, terraformMainDir);
    configureWorkspace(configs.name, terraformMainDir)
    terraformApply(configs.name, region, terraformMainDir, domain,
                  subnetAid, subnetBid, configs.pgUsername, configs.pgPassword,
                  configs.jwtSecret,configs.apiToken, route53ZoneId);  
    const tfOutputs = execSync("terraform output -json", {
      cwd: terraformMainDir,
    }).toString();
    const projectEndpoint = JSON.parse(tfOutputs).app_url.value;
    addProjectToDynamo(configs.name, projectEndpoint, region, configs.apiToken,
                       configs.jwtSecret, configs.pgUsername, configs.pgPassword);
    addApiSchema(configs.apiToken, configs.name, domain)
  } catch (error) {
    console.error("Error executing Terraform apply:", error);
    process.exit(1);
  }
}

export async function uploadSchema(schemaFile, projectName) {
  const { region }= getInfoForProjects();
  try {
    const project = await getProjectFromDynamo(projectName, region);
    const { endpoint, apiToken } = project;
    const response = execSync(`curl -H "Authorization: Bearer ${apiToken}" -F 'file=@${schemaFile}' https://${endpoint}/schema`);

  } catch (err) {
    console.error(err);
  }
}

export async function listProjects() {
  const { region } = getInfoForProjects();
  const projects = await getAllProjects(region);
  const projectNames = projects.map((proj) => proj.name);
  return projectNames;
}

export async function removeProject(configs) {
  const { bucketName, region, subnetAid, subnetBid, route53ZoneId } = getInfoForProjects();
  const projectInfo = await getProjectFromDynamo(configs.name, region);
  const domainName = projectInfo.endpoint.split(".").slice(1).join(".");
  const { apiToken, pgPassword, pgUsername, jwtSecret } = projectInfo;

  terraformInit(bucketName, region, terraformMainDir);
  configureWorkspace(configs.name, terraformMainDir);
  terraformDestroy(configs.name, region, terraformMainDir, domainName,
    subnetAid, subnetBid, pgUsername, pgPassword, jwtSecret, apiToken, route53ZoneId);
  execSync("terraform workspace select default", { cwd: terraformMainDir });
  removeProjectFromDynamo(configs.name, region);
}

export async function removeAdmin() {
  const { bucketName, region, domain } = getInfoForProjects();
  try {
    terraformInit(bucketName, region, terraformAdminDir);
    configureWorkspace("admin", terraformAdminDir);
    execSync(`terraform destroy -auto-approve \
    -var="region=${region}" -var="domain_name=${domain}"`, { cwd: terraformAdminDir});
    await emptyS3(bucketName, region);
    await removeS3(bucketName, region)

  } catch (err) {
    console.error(err);
  }
}

export async function removeProjects() {
  const { region } = getInfoForProjects();
  const dynamoExists = await dynamoDbExists(region);
  if (dynamoExists) {
    const activeProjects = await getAllProjects(region);
    await Promise.all(activeProjects.map(async proj => {
      await removeProject(proj);
    }));
  }
}

