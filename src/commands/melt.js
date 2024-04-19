import { getInfoForProjects } from "../utils/localFileHelpers.js";
import { terraformInit, configureWorkspace, terraformDestroyAdmin } from "../utils/processes.js";
import { emptyS3, removeS3 } from "../utils/awsHelpers.js";
import * as directories from "../utils/directories.js";
import * as ui from "../utils/ui.js";
import inquirer from "inquirer";
import Listr from "listr";

export async function melt(options) {
  ui.warning(
    "Warning: This action is irreversible and will remove the snowclone admin infrastructure from AWS"
  );

  const answer = await inquirer.prompt([
    {
      type: "input",
      name: "confirmation",
      message: 'To proceed, type "yes":',
    },
  ]);
  
  if (answer.confirmation.toLowerCase() === "yes") {
    const { bucketName, region, domain } = getInfoForProjects();
    const taskList = new Listr(
      [
        {
          title: "Reinitializing terraform",
          task: async (_, task) => {
            await terraformInit(bucketName, region, directories.terraformAdminDir);
            task.title = "Terraform reinitialized!"
          }
        },
        {
          title: ui.dim("Reconfiguring workspace"),
          task: async (_, task) => {
            await configureWorkspace("admin", directories.terraformAdminDir);
            task.title = "Workspace reconfigured!"
          }
        },
        {
          title: ui.dim("Destroying admin infrastructure"),
          task: async (_, task) => {
            await terraformDestroyAdmin(region, domain, directories.terraformAdminDir);
            task.title = "Admin infrastructure destroyed!"
          }
        },
        {
          title: ui.dim("Removing S3 bucket"),
          task: async (_, task) => {
            await configureWorkspace("default", directories.terraformMainDir);
            await emptyS3(bucketName, region);
            await removeS3(bucketName, region);
            task.title = "S3 bucket removed!"
          }
        }
      ]
    )

    await taskList.run();
  } else {
    ui.warning("Operation aborted.");
  }
}