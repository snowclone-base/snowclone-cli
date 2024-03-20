import fs from "fs";
import ncp from "ncp";
import path from "path";
import { promisify } from "util";
import { execSync } from "child_process";
import { fileURLToPath } from 'url';

const access = promisify(fs.access);
const copy = promisify(ncp);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function copyTemplateFiles(options) {
  return copy(options.templateDirectory, options.targetDirectory, {
    clobber: false,
  });
}



export function initializeAdmin() {
  const terraformAdminDir = path.join(__dirname, "terraform", "admin");
  execSync("terraform init", { cwd: terraformAdminDir });
  console.log("Initialized admin!");
  execSync("terraform apply -auto-approve", { cwd: terraformAdminDir });
  console.log("Admin stack applied!")
}

export function deployProject(configurations) {
  try {
    const terraformMainDir = path.join(__dirname, "terraform");
    execSync("terraform init", { cwd: terraformMainDir});
    console.log("Initialized!");
    const tfOutput = execSync(`terraform apply -auto-approve -var="desired_region=${configurations.region}" -var="project_name=${configurations.name}"`, { encoding: "utf-8", cwd: terraformMainDir});
    console.log("Stack has been deployed!");
  } catch (error) {
    console.error('Error executing Terraform apply:', error.message);
    process.exit(1);
  }
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
