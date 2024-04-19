import { getInfoForProjects } from "../utils/localFileHelpers.js";
import { getProjectFromDynamo, removeProjectFromDynamo } from "../utils/awsHelpers.js";
import { terraformInit, terraformDestroy, configureWorkspace } from "../utils/processes.js";
import * as directories from "../utils/directories.js";
import * as ui from "../utils/ui.js";
import inquirer from "inquirer";
import Listr from "listr";

export async function remove(options) {
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
  };
  
  const { bucketName, region, subnetAid, subnetBid, route53ZoneId } = getInfoForProjects();
  let projectInfo, domainName;
  
  const taskList = new Listr(
    [
      {
        title: "Fetching info for project",
        task: async (_, task) => {
          projectInfo = await getProjectFromDynamo(configs.name, region);
          domainName = projectInfo.endpoint.split(".").slice(1).join(".");
          task.title = "Project info fetched!";
        }
      },
      {
        title: ui.dim("Reinitializing Terraform"),
        task: async (_, task) => {
          await terraformInit(bucketName, region, directories.terraformMainDir);
          task.title = "Terraform reinitialized!";
        }
      },
      {
        title: ui.dim("Destroying backend infrastructure"),
        task: async (_, task) => {
          await terraformDestroy(
            configs.name,
            region,
            directories.terraformMainDir,
            domainName,
            subnetAid,
            subnetBid,
            projectInfo.pgUsername,
            projectInfo.pgPassword,
            projectInfo.jwtSecret,
            projectInfo.apiToken,
            route53ZoneId
          );
          await configureWorkspace("default", directories.terraformMainDir);
          task.title = "Backend infrastructure destroyed!";
        }
      },
      {
        title: ui.dim("Removing backend info from DynamoDB"),
        task: async (_, task) => {
          await removeProjectFromDynamo(configs.name, region);
          task.title = "Backend removed from DynamoDB!"
        }
      }
    ]
  )

  ui.waiting("Removing backend from AWS. This could take several minutes...");

  await taskList.run();

  ui.success("Your backend has successfully been removed from AWS!");
}