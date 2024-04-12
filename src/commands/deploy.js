import { addProjectToDynamo } from "../utils/awsHelpers.js";
import inquirer from "inquirer";
import Listr from "listr";
import * as ui from "../utils/ui.js";
import * as directories from "../utils/directories.js";
import { getInfoForProjects } from "../utils/localFileHelpers.js";
import { terraformInit, configureWorkspace, terraformApply } from "../utils/processes.js";

export async function deploy(options) {
  const configs = {
    name:
      options.name ||
      (
        await inquirer.prompt({
          type: "input",
          name: "name",
          message: "Specify the project name",
        })
      ).name,
    pgUsername:
        options.pgUsername ||
        (
          await inquirer.prompt({
            type: "input",
            name: "pgUsername",
            message: "Specify a postgres password",
          })
        ).pgUsername,
    pgPassword:
        options.pgPassword ||
        (
          await inquirer.prompt({
            type: "input",
            name: "pgPassword",
            message: "Specify a postgres username",
          })
        ).pgPassword,
    jwtSecret:
        options.jwtSecret ||
          (
            await inquirer.prompt({
              type: "input",
              name: "jwtSecret",
              message: "Specify a JWT secret",
            })
          ).jwtSecret,
    apiToken:
        options.apiToken ||
          (
            await inquirer.prompt({
              type: "input",
              name: "apiToken",
              message: "Specify an API token",
            })
          ).apiToken,
  };

// add project to dynamo
// add api schema
  let infoForProject;

  const taskList = new Listr(
    [
      {
        title: "Fetching info for AWS resources",
        task: async (_, task) => {
          infoForProject = getInfoForProjects();
          task.title = "Info for AWS resources fetched!"
        }
      },
      {
        title: ui.dim("Initializing Terraform"),
        task: async (_, task) => {
          await terraformInit(infoForProject.bucketName, infoForProject.region, directories.terraformAdminDir);
          task.title = "Terraform initialized!"
        }
        
      },
      {
        title: ui.dim("Configuring Terraform workspace"),
        task: async (_, task) => {
          await configureWorkspace(configs.name, directories.terraformAdminDir);
          task.title = "Workspace configured!"
        }
      },

      {
        title: ui.dim("Provisioning backend infrastructure"),
        task: async (_, task) => {
          await terraformApply(configs.name,
                               infoForProject.region,
                               directories.terraformMainDir,
                               infoForProject.domain,
                               infoForProject.subnetAid,
                               infoForProject.subnetBid,
                               configs.pgUsername,
                               configs.pgPassword,
                               configs.jwtSecret,
                               configs.apiToken,
                               infoForProject.route53ZoneId
                               );
          task.title = "Project infrastructure provisioned!"
        }
      },
      {
        title: ui.dim("Adding project info to DynamoDB"),
        task: async (_, task) => {
          const projectEndpoint = `${configs.name}.${infoForProject.domain}`;
          await addProjectToDynamo(configs.name, 
                                   projectEndpoint, 
                                   infoForProject.region, 
                                   configs.apiToken,
                                   configs.jwtSecret, 
                                   configs.pgUsername, 
                                   configs.pgPassword);
          task.title = "Project info added to dynamo!";
        }
      },
    ]
  )
  await taskList.run();
}