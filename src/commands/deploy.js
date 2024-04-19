import { addProjectToDynamo } from "../utils/awsHelpers.js";
import inquirer from "inquirer";
import Listr from "listr";
import * as ui from "../utils/ui.js";
import * as directories from "../utils/directories.js";
import { getInfoForProjects } from "../utils/localFileHelpers.js";
import { terraformInit, configureWorkspace, terraformApply, addApiSchema } from "../utils/processes.js";
import { generateHash } from "../utils/hashGenerator.js";

export async function deploy(options) {
  console.log(ui.purple("\n Welcome to..."))
  console.log(ui.asciiBanner);
  const configs = {
    name:
      options.name ||
      (
        await inquirer.prompt({
          type: "input",
          name: "name",
          message: "Specify the project name:",
        })
      ).name,
  };

  const { bucketName, region, domain, subnetAid, subnetBid, route53ZoneId } = getInfoForProjects();
  const jwtSecret = generateHash(32);
  const apiToken = generateHash(8);

  const taskList = new Listr(
    [
      {
        title: "Initializing Terraform",
        task: async (_, task) => {
          await terraformInit(bucketName, region, directories.terraformMainDir);
          task.title = "Terraform initialized!"
        }
      },
      {
        title: ui.dim("Configuring Terraform workspace"),
        task: async (_, task) => {
          await configureWorkspace(configs.name, directories.terraformMainDir);
          task.title = "Workspace configured!"
        }
      },

      {
        title: ui.dim("Provisioning backend infrastructure"),
        task: async (_, task) => {
          await terraformApply(configs.name,
                               region,
                               directories.terraformMainDir,
                               domain,
                               subnetAid,
                               subnetBid,
                               "pgUsername",
                               "pgPassword",
                               jwtSecret,
                               apiToken,
                               route53ZoneId
                               );
          task.title = "Backend infrastructure provisioned!"
        }
      },
      {
        title: ui.dim("Adding project info to DynamoDB"),
        task: async (_, task) => {
          const projectEndpoint = `${configs.name}.${domain}`;
          await addProjectToDynamo(configs.name, 
                                   projectEndpoint, 
                                   region, 
                                   apiToken,
                                   jwtSecret, 
                                   "pgUsername",
                                   "pgPassword")
          task.title = "Project info added to DynamoDB!";
        }
      },
      {
        title: ui.dim("Configuring APIs"),
        task: async (_, task) => {

          await addApiSchema(apiToken, configs.name, domain);
          task.title = "APIs configured!"
        }
      }
    ]
  )

  ui.waiting("Snowclone could take several minutes to finish deploying... ");

  await taskList.run();
  ui.success(`Your project "${configs.name}" is deployed to AWS!`);
  console.log("\n - Your API endpoint is: ", ui.green(`https://${configs.name}.${domain}`));
  console.log(" - Your JWT secret is: ", ui.green(jwtSecret));
  console.log(" - Your API token is: ", ui.green(apiToken));
  console.log(" - Temporary Postgres Username: ",  ui.green("pgUsername"));
  console.log(" - Temporary Postgres Password: ", ui.green("pgPassword"));
  console.log(ui.green("\nPlease make sure to change Postgres credentials before using in production."));
  console.log(ui.green("\nThese values can also be found in your DynamoDB."));
}
