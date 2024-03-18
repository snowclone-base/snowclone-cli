import fs from "fs";
import ncp from "ncp";
import path from "path";
import { promisify } from "util";
import { execSync } from "child_process"

const access = promisify(fs.access);
const copy = promisify(ncp);

async function copyTemplateFiles(options) {
  return copy(options.templateDirectory, options.targetDirectory, {
    clobber: false,
  });
}

function saveBackendInfo(configurations, tfOutput) {
  const filePath = "./backends/backend_info.txt";
  const content = JSON.stringify({
    userInput: configurations,
    terraformOutput: tfOutput,
  })

  fs.mkdir("./backends", { recursive: true }, (err) => {
    if (err) {
      console.error("error creating directory:, ", err);
      return;
    }

    fs.writeFile(filePath, content, (err) => {
      if (err) {
        console.error("error writing to file: ", err);
        return
      }
      console.log("new file created!")
    })
  })
}

export function deployProject(configurations) {
  try {
    execSync("terraform init");
    console.log("Initialized!");
    const tfOutput = execSync(`terraform apply -auto-approve -var="desired_region=${configurations.region}" -var="project_name=${configurations.name}"`, { encoding: "utf-8"});
    console.log("Stack has been deployed!");
    saveBackendInfo(configurations, tfOutput);
  } catch (error) {
    console.error('Error executing Terraform apply:', error.message);
    process.exit(1);
  }
}

export function removeProject(projectName) {
  const filePath = "./backends/backend_info.txt"
  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }
    let projectConfigData = JSON.parse(data).userInput
    execSync(`terraform destroy -auto-approve -var="desired_region=${projectConfigData.region}" -var="project_name=${projectConfigData.name}"`)
  })
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
