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

export async function terraformDestroy(projectName,
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
      `terraform destroy -auto-approve  -var="project_name=${projectName}" \
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

export async function terraformDestroyAdmin(region, domain, directory) {
  return new Promise((resolve, reject) => {
    exec(`terraform destroy -auto-approve \
    -var="region=${region}" -var="domain_name=${domain}"`,
    { cwd: directory}, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  })
}

export async function addApiSchema(apiToken, projectName, domain) {
  return new Promise((resolve, reject) => {
    const command = `curl -H "Authorization: Bearer ${apiToken}" -o /dev/null -w "%{http_code}" \
                    -F "file=@apiSchema.sql" https://${projectName}.${domain}/schema`;
    const intervalId = setInterval(() => {
      exec(command, { stdio: ['pipe', 'ignore', 'ignore'], encoding: "utf-8", cwd: directories.sqlDir },
          (error, stdout, stderr) => {
            if (error) {
              clearInterval(intervalId);
              reject(error);
              return;
            }
          
            const statusCode = parseInt(stdout.trim(), 10);
            if (statusCode === 201) {
              clearInterval(intervalId);
              resolve(stdout);
            }
        }
      );
    }, 5000);
  });
}

export async function uploadSchema(schemaFile, endpoint, apiToken) {
  return new Promise((resolve, reject) => {
    const command = `curl -H "Authorization: Bearer ${apiToken}" -o /dev/null -w "%{http_code}" \
                    -F 'file=@${schemaFile}' https://${endpoint}/schema`
    exec(command, { stdio: ['pipe', 'ignore', 'ignore'] }, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            const statusCode = parseInt(stdout.trim(), 10);
            resolve(stdout);
            return statusCode;
          }
        });
  })
}
