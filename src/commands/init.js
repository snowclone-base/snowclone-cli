import inquirer from "inquirer";
import Listr from "listr";
import * as directories from "../utils/directories.js";
import { terraformInit, configureWorkspace, terraformApplyAdmin } from "../utils/processes.js";
import crypto from "crypto";
import { createS3 } from "../utils/awsHelpers.js";
import { getTfOutputs, saveInfoForProjects } from "../utils/localFileHelpers.js";
import * as ui from "../utils/ui.js";

export async function init(options) {
  const configs = {
    region:
      options.region ||
      (
        await inquirer.prompt({
          type: "input",
          name: "region",
          message: "Specify your desired AWS region",
        })
      ).region,
    domain:
      options.domain ||
        (
          await inquirer.prompt({
            type: "input",
            name: "domain",
            message: "Specify your domain name",
          })
        ).domain
  };

  const s3BucketName = "snowclone-" + crypto.randomBytes(6).toString("hex");

  const taskList = new Listr(
    [
      {
        title: "Creating S3 bucket",
        task: async (_, task) => {
          await createS3(s3BucketName, configs.region);
          task.title = "S3 bucket created!"
        }
      },
      {
        title: ui.dim("Initializing Terraform"),
        task: async (_, task) => {
          await terraformInit(s3BucketName, configs.region, directories.terraformAdminDir);
          task.title = "Terraform initialized!"
        }
        
      },
      {
        title: ui.dim("Configuring Terraform workspace"),
        task: async (_, task) => {
          await configureWorkspace("admin", directories.terraformAdminDir);
          task.title = "Workspace configured!"
        }
      },
      {
        title: ui.dim("Provisioning admin infrastructure"),
        task: async (_, task) => {
          await terraformApplyAdmin(configs, directories.terraformAdminDir);
          task.title = "Adming infrastructure provisioned!"
        }
      },
      {
        title: ui.dim("Save admin info locally"),
        task: (_, task) => {
          const tfOutputs = getTfOutputs(directories.terraformAdminDir);
          saveInfoForProjects(
            s3BucketName, 
            configs.region, 
            configs.domain, 
            tfOutputs.subnetAid, 
            tfOutputs.subnetBid, 
            tfOutputs.route53ZoneId
          );
          task.title = "Admin info saved!";
        }
      }
    ]
  )
  await taskList.run();
}
