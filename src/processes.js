import { spawn, spawnSync, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from "path";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const homeDir = os.homedir();
const appDir = path.join(homeDir, "snowclone");
const terraformMainDir = path.join(__dirname, "terraform/instance");
const terraformAdminDir = path.join(__dirname, "terraform/admin");

function spawnAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data;
      console.log(`stdout: ${data}`);
    });

    child.stderr.on('data', (data) => {
      stderr += data;
      console.error(`stderr: ${data}`);
    });

    child.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`child process exited with code ${code}`));
      }
    });
  });
}

// export async function terraformInit(bucketName, region, directory) {
//   try {
//     const result = await spawnAsync("terraform", [
//       "init",
//       "-reconfigure",
//       `-backend-config=bucket=${bucketName}`,
//       `-backend-config=region=${region}`,
//       `-backend-config=key=terraform.tfstate`
//     ], { encoding: "utf-8", cwd: directory });
//     console.log('stdout:', result.stdout);
//     console.error('stderr:', result.stderr);
//   } catch (error) {
//     console.error(error);
//   }
// }

export function terraformInit(bucketName, region, directory) {
  let output = execSync(`terraform init -reconfigure \
    -backend-config="bucket=${bucketName}" \
    -backend-config="region=${region}" \
    -backend-config="key=terraform.tfstate"`,
      { cwd: directory }
    );
    console.log("output: ", output.toString())
}

export async function configureWorkspace(workspaceName, directory) {
  try {
    const result = await spawnAsync("terraform", [
      "workspace",
      "select",
      "-or-create",
      `${workspaceName}`,
    ], { encoding: "utf-8", cwd: directory })
  } catch (error) {
    console.error(error);
  }
}

export async function terraformApplyProject(
  projectName,
  region,
  directory,
  domainName,
  subnetAid,
  subnetBid,
  pgUsername,
  pgPassword,
  jwtSecret,
  apiToken,
  route53ZoneId) {
    try {
      const result = await spawnAsync("terraform", [
        "apply",
        "-auto-approve",
        `-var="project_name=${projectName}"`,
        `-var="domain_name=${domainName}"`,
        `-var="region=${region}"`,
        `-var="private_subnet_a_id=${subnetAid}"`,
        `-var="private_subnet_b_id=${subnetBid}"`,
       `-var="postgres_username=${pgUsername}"`,
       `-var="postgres_password=${pgPassword}"`,
       `-var="api_token=${apiToken}"`,
       `-var="jwt_secret=${jwtSecret}"`,
       `-var="aws_route53_zone_id=${route53ZoneId}"`
      ],  { encoding: "utf-8", cwd: directory })
    } catch (error) {
      console.error(error)
    }
  }

  export async function terraformApplyAdmin(configs, directory) {
    execSync(`terraform apply -auto-approve \
    -var="region=${configs.region}" -var="domain_name=${configs.domain}"`,
   { encoding: "utf-8", cwd: directory })
  }

  //terraformApplyProject({ region: "us-west-2", domain: "snowclone.xyz" }, "/Users/lukepowers/Downloads/Code/snowclone-cli/src/terraform/admin")

  export async function terraformDestroyProject(
    projectName,
    region,
    directory,
    domainName,
    subnetAid,
    subnetBid,
    pgUsername,
    pgPassword,
    jwtSecret,
    apiToken,
    route53ZoneId) {
    try {
      const result = await spawnAsync("terraform", [
        "destroy",
        "-auto-approve",
        `-var="project_name=${projectName}"`,
        `-var="domain_name=${domainName}"`,
        `-var="region=${region}"`,
        `-var="private_subnet_a_id=${subnetAid}"`,
        `-var="private_subnet_b_id=${subnetBid}"`,
       `-var="postgres_username=${pgUsername}"`,
       `-var="postgres_password=${pgPassword}"`,
       `-var="api_token=${apiToken}"`,
       `-var="jwt_secret=${jwtSecret}"`,
       `-var="aws_route53_zone_id=${route53ZoneId}"`
      ],  { encoding: "utf-8", cwd: directory })
    } catch (error) {
      console.error(error)
    }
  }

  export function terraformApply(projectName, region, directory, domainName, subnetAid, subnetBid, pgUsername, pgPassword, jwtSecret, apiToken, route53ZoneId) {
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
  