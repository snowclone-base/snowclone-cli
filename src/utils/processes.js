import { exec } from "child_process";
import * as directories from "../utils/directories.js"

export async function terraformInit(bucketName, region, directory) {
  return new Promise((resolve, reject) => {
    exec(`terraform init -reconfigure \
    -backend-config="bucket=${bucketName}" \
    -backend-config="region=${region}" \
    -backend-config="key=terraform.tfstate"`,
      { encoding: "utf-8", cwd: directory },
      (error, stdout, stderr) => {
        if (error) {
          reject(stderr);
        } else {
          resolve(stdout);
        }
      }
    );
  })
  
}

export async function configureWorkspace(workspaceName, directory) {
  return new Promise((resolve, reject) => {
    exec(`terraform workspace select -or-create ${workspaceName}`,
    { encoding: 'utf-8', cwd: directory }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

export async function terraformApplyAdmin(configs, directory) {
  return new Promise((resolve, reject) => {
    exec(`terraform apply -auto-approve \
    -var="region=${configs.region}" -var="domain_name=${configs.domain}"`,
    { encoding: "utf-8", cwd: directory }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    })
  })
}

export async function terraformApply(projectName,
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
  return new Promise((resolve, reject) => {
    exec(
      `terraform apply -auto-approve  -var="project_name=${projectName}" \
       -var="domain_name=${domainName}" -var="region=${region}" \
       -var="private_subnet_a_id=${subnetAid}" -var="private_subnet_b_id=${subnetBid}" \
       -var="postgres_username=${pgUsername}" -var="postgres_password=${pgPassword}" \
       -var="api_token=${apiToken}" -var="jwt_secret=${jwtSecret}" \
       -var="aws_route53_zone_id=${route53ZoneId}"`,
      { encoding: "utf-8", cwd: directory }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      }
    );
  })
}

// export async function getProjectEndpoint() {
//   return new Promise((resolve, reject) => {
//       exec("terraform output -json", {
//           cwd: directories.terraformAdminDir,
//       }, (error, stdout, stderr) => {
//           if (error) {
//               reject(new Error(`Error executing terraform command: ${stderr}`));
//           } else {
//               try {
//                   const tfOutputs = JSON.parse(stdout);
//                   const projectEndpoint = tfOutputs.app_url.value;
//                   resolve(projectEndpoint);
//               } catch (parseError) {
//                   reject(new Error(parseError.message));
//               }
//           }
//       });
//   });
// }