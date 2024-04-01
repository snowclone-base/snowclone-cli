import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { fileURLToPath } from 'url';
import crypto from "crypto";
import { addProjectToDynamo,
        getProjectFromDynamo,
        removeProjectFromDynamo, 
        createS3,
        getAllProjects,
        getAWSRegions,
        emptyS3,
        removeS3 } from "./awsHelpers.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const homeDir = os.homedir();
const appDir = path.join(homeDir, "snowclone");
const terraformMainDir = path.join(__dirname, "terraform/instance");
const terraformAdminDir = path.join(__dirname, "terraform/admin");

// save bucket name to users home directory in snowclone folder
function saveS3Info(bucketName, region ) {
  const data = { bucketName, region };
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
      console.error(err)
    } 
  })
}

function terraformInit(bucketName, region, directory) {
  execSync(`terraform init -reconfigure \
    -backend-config="bucket=${bucketName}" \
    -backend-config="region=${region}" \
    -backend-config="key=terraform.tfstate"`,
      { cwd: directory }
    );
}

function configureWorkspace(workspaceName, directory) {
  execSync(`terraform workspace select -or-create ${workspaceName}`, { cwd: directory });
}

function terraformApply(name, region, directory) {
  execSync(
    `terraform apply -auto-approve  -var="project_name=${name}" \
     -var="domain_name=snowclone.xyz" -var="region=${region}"`,
    { encoding: "utf-8", cwd: directory }
  );
}

function terraformDestroy(projectName, region, domainName, directory) {
  execSync(`terraform destroy -auto-approve \
    -var="project_name=${projectName}" \
    -var="region=${region}" \
    -var="domain_name=${domainName}"`,
    { cwd: directory});
}

async function isValidRegion(region) {
  const regions = await getAWSRegions();
  return regions.includes(region);
}

// get info from file we saved
function getS3Info() {
  const s3File = path.join(appDir, "S3.json");
  const data = fs.readFileSync(s3File, "utf8");
  return JSON.parse(data);
}

function addApiSchema() {
  const intervalId = setInterval(() => {
    const response = execSync('curl -H "Authorization: Bearer helo" -w "%{http_code}" -F "file=@sampleSchema.sql" https://beep.snowclone.xyz/schema');
    const statusCode = parseInt(response.toString(), 10);
    if (statusCode === 201) {
      clearInterval(intervalId);
    }
  }, 5000);
}

// create S3 bucket, create admin infra and save state to the bucket. (deal w/ configs, change to try/ catch block later)
export async function initializeAdmin(configs) {
  const s3BucketName = "snowclone-" + crypto.randomBytes(6).toString("hex");

  await createS3(s3BucketName, configs.region);
  terraformInit(s3BucketName, configs.region, terraformAdminDir);
  configureWorkspace("admin", terraformAdminDir);
  console.log("Initialized admin!");
  execSync(`terraform apply -auto-approve`, { cwd: terraformAdminDir });
  console.log("Admin stack applied!");
  saveS3Info(s3BucketName, configs.region);
}

// provision backend, save endpoint to dynamo
export async function deployProject(configs) {
  let validRegion = await isValidRegion(configs.region);
  const { bucketName, region } = getS3Info();

  if (!validRegion) {
    console.log("Please enter a valid region");
    return;
  }

  try {
    terraformInit(bucketName, region, terraformMainDir);

    console.log("Initialized!");
    configureWorkspace(configs.name, terraformMainDir)
    console.log("workspace initialized!");
    terraformApply(configs.name, configs.region, terraformMainDir);
    
    console.log("Stack has been deployed!");
    const tfOutputs = execSync("terraform output -json", {
      cwd: terraformMainDir,
    }).toString();
    const projectEndpoint = JSON.parse(tfOutputs).app_url.value;
    addProjectToDynamo(configs.name, projectEndpoint, region);
    //addApiSchema()
  } catch (error) {
    console.error("Error executing Terraform apply:", error);
    process.exit(1);
  }
}

export async function uploadSchema(schemaFile, projectName) {
  const { region }= getS3Info();
  try {
    const project = await getProjectFromDynamo(projectName, region);
    const endpoint = project.endpoint;
    execSync(`curl -H "Authorization: Bearer helo" -F 'file=@${schemaFile}' ${endpoint}/schema`);
    console.log("Schema imported successfully!")
  } catch (err) {
    console.error(err);
  }
}

export async function listProjects() {
  const { region }= getS3Info();
  const projects = await getAllProjects(region);
  const projectNames = projects.map((proj) => proj.name);
  console.log("Active Projects: ");
  projectNames.forEach(proj => console.log(proj));
}

export async function removeProject(configs) {
  const { bucketName, region } = getS3Info();
  const projectInfo = await getProjectFromDynamo(configs.name, region);
  const domainName = projectInfo.endpoint.split(".").slice(1).join(".");

  terraformInit(bucketName, region, terraformMainDir);
  configureWorkspace(configs.name, terraformMainDir);
  terraformDestroy(configs.name, region, domainName, terraformMainDir);
  removeProjectFromDynamo(configs.name, region);
}


export async function tearDownAWS() {
  const { bucketName, region } = getS3Info();
  const activeProjects = await getAllProjects(region);
  activeProjects.forEach(async proj => {
    console.log("removing: ", proj)
    await removeProject(proj)
  });

  try {
    terraformInit(bucketName, region, terraformAdminDir);
    configureWorkspace("admin", terraformAdminDir);
    console.log("initialized!!")
    execSync("terraform destroy -auto-approve", { cwd: terraformAdminDir});
    await emptyS3(bucketName, region);
    await removeS3(bucketName, region);
    removeLocalFile();
  } catch (err) {
    console.error(err)
  }
}

