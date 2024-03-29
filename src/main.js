import fs from "fs";
import ncp from "ncp";
import path from "path";
import os from "os";
import { promisify } from "util";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import crypto from "crypto";
import {
  addProjectToDynamo,
  getProjectFromDynamo,
  removeProjectFromDynamo,
  createS3,
  getAllProjects,
  getAWSRegions,
  emptyS3,
  removeS3,
} from "./awsHelpers.js";

const access = promisify(fs.access);
const copy = promisify(ncp);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const homeDir = os.homedir();
const appDir = path.join(homeDir, "snowclone");
const terraformMainDir = path.join(__dirname, "terraform/instance");
const terraformAdminDir = path.join(__dirname, "terraform/admin");

async function copyTemplateFiles(options) {
  return copy(options.templateDirectory, options.targetDirectory, {
    clobber: false,
  });
}

// save bucket name to users home directory in snowclone folder
function saveS3Info(bucketName) {
  const data = { bucketName };
  fs.mkdirSync(appDir, { recursive: true });
  const fileName = path.join(appDir, "S3.json");

  fs.writeFile(fileName, JSON.stringify(data), (err) => {
    if (err) {
      console.error(err);
    }
  });
}

function removeLocalFile() {
  fs.unlink(appDir, (err) => {
    if (err) {
      console.error(err);
    }
  });
}

async function isValidRegion(region) {
  const regions = await getAWSRegions();
  return regions.includes(region);
}

// get info from file we saved
function getS3Info() {
  const s3File = path.join(appDir, "S3.json");
  const data = fs.readFileSync(s3File, "utf8");
  return JSON.parse(data).bucketName;
}

// create S3 bucket, create admin infra and save state to the bucket. (deal w/ configs, change to try/ catch block later)
export async function initializeAdmin() {
  const s3BucketName = "snowclone-" + crypto.randomBytes(6).toString("hex");

  await createS3(s3BucketName);
  execSync(
    `terraform init -reconfigure \

  -backend-config="bucket=${s3BucketName}" \
  -backend-config="region=us-west-2" \
  -backend-config="key=admin/terraform.tfstate"`,
    { cwd: terraformAdminDir }
  );
  console.log("Initialized admin!");
  execSync(`terraform apply -auto-approve`, { cwd: terraformAdminDir });
  console.log("Admin stack applied!");
  saveS3Info(s3BucketName);
}

// provision backend, save endpoint to dynamo
export async function deployProject(configs) {
  let validRegion = await isValidRegion(configs.region);
  const s3BucketName = getS3Info();

  if (!validRegion) {
    console.log("Please enter a valid region");
    return;
  }

  try {
    execSync(
      `terraform init -reconfigure \
    -backend-config="bucket=${s3BucketName}" \
    -backend-config="region=us-west-2" \
    -backend-config="key=${configs.name}/terraform.tfstate"`,
      { cwd: terraformMainDir }
    );

    console.log("Initialized!");
    execSync(`terraform workspace select -or-create ${configs.name}`);
    console.log("workspace initialized!");
    execSync(
      `terraform apply -auto-approve  -var="project-name=${configs.name}"`,
      { encoding: "utf-8", cwd: terraformMainDir }
    );
    console.log("Stack has been deployed!");
    const tfOutputs = execSync("terraform output -json", {
      cwd: terraformMainDir,
    }).toString();
    const projectEndpoint = JSON.parse(tfOutputs).app_url.value;
    addProjectToDynamo(configs.name, projectEndpoint);
  } catch (error) {
    console.error("Error executing Terraform apply:", error);
    process.exit(1);
  }
}

export async function uploadSchema(schemaFile, projectName) {
  try {
    const project = await getProjectFromDynamo(projectName);
    const endpoint = project.endpoint;
    execSync(
      `curl -H "Authorization: Bearer helo" -F 'file=@${schemaFile}' ${endpoint}/schema`
    );
    console.log("Schema imported successfully!");
  } catch (err) {
    console.error(err);
  }
}

export async function listProjects() {
  const projects = await getAllProjects();
  const projectNames = projects.map((proj) => proj.name);
  console.log("Active Projects: ");
  projectNames.forEach((proj) => console.log(proj));
}

export function removeProject(configs) {
  const s3BucketName = getS3Info();
  execSync("terraform workspace select default", { cwd: terraformMainDir });
  execSync(
    `terraform init -reconfigure \
  -backend-config="bucket=${s3BucketName}" \
  -backend-config="region=us-west-2" \
  -backend-config="key=${configs.name}/terraform.tfstate"`,
    { cwd: terraformMainDir }
  );
  execSync(
    `terraform destroy -auto-approve -var="project-name=${configs.name}"`
  );
  removeProjectFromDynamo(configs.name);
}

export async function tearDownAWS() {
  const s3BucketName = getS3Info();
  const activeProjects = await getAllProjects();
  activeProjects.forEach((proj) => {
    console.log("removing: ", proj);
    removeProject(proj);
  });

  try {
    execSync(
      `terraform init -reconfigure \
    -backend-config="bucket=${s3BucketName}" \
    -backend-config="region=us-west-2" \
    -backend-config="key=admin/terraform.tfstate"`,
      { cwd: terraformAdminDir }
    );
    execSync("terraform destroy -auto-approve", { cwd: terraformAdminDir });
    await emptyS3(s3BucketName);
    await removeS3(s3BucketName);
    removeLocalFile();
  } catch (err) {
    console.error(err);
  }
}
