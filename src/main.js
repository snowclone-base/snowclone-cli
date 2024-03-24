import fs from "fs";
import ncp from "ncp";
import path from "path";
import { promisify } from "util";
import { execSync } from "child_process";
import { fileURLToPath } from 'url';
import crypto from "crypto";
import { saveS3InfoToDynamo, saveTFStateToS3, addEndpointToDynamo, getLBEndpoint } from "./awsHelpers.js"

const access = promisify(fs.access);
const copy = promisify(ncp);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function copyTemplateFiles(options) {
  return copy(options.templateDirectory, options.targetDirectory, {
    clobber: false,
  });
}

// deal w/ configs, change to try/ catch block
export function initializeAdmin(configs) {
  const s3BucketName = crypto.randomBytes(12).toString("hex");
  const terraformAdminDir = path.join(__dirname, "terraform", "admin");
  execSync("terraform init", { cwd: terraformAdminDir });
  console.log("Initialized admin!");
  execSync(`terraform apply -auto-approve -var="bucket_name=${s3BucketName}"`, { cwd: terraformAdminDir });
  console.log("Admin stack applied!")
  saveS3InfoToDynamo(s3BucketName);
  let tfJSON = execSync("terraform show -json terraform.tfstate", { cwd: terraformAdminDir });
}

export function deployProject(configs) {
  try {
    const terraformMainDir = path.join(__dirname, "terraform");
    execSync("terraform init", { cwd: terraformMainDir});
    console.log("Initialized!");
    execSync(`terraform apply -auto-approve`, { encoding: "utf-8", cwd: terraformMainDir});
    console.log("Stack has been deployed!");
    let tfJSON = execSync("terraform show -json terraform.tfstate", { cwd: terraformMainDir});
    let backendEndpoint = JSON.parse(tfJSON.toString()).values.outputs.app_url.value;
    saveTFStateToS3(configs.name);
    addEndpointToDynamo(configs.name, backendEndpoint);
  } catch (error) {
    console.error('Error executing Terraform apply:', error.message);
    process.exit(1);
  }
}

export function uploadSchema(schemaFile, projectName) {
  const LBEndpoint = getLBEndpoint(projectName);
  execSync(`curl -F 'file=@${schemaFile}' ${LBEndpoint}/schema`);
}

// creates a new directory in .
export async function createProject(options) {
  options = {
    ...options,
    targetDirectory: options.name
      ? path.join(process.cwd(), options.name)
      : process.cwd(),
  }; 

  const currentFileUrl = import.meta.url;
  const templateDir = path.resolve(
    new URL(currentFileUrl).pathname,
    "../../relay-instance-template"
  );
  options.templateDirectory = templateDir;

  try {
    await access(templateDir, fs.constants.R_OK);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  console.log("Copy project files");
  await copyTemplateFiles(options);

  console.log("Project ready");
  return true;
}
