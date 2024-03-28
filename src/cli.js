import {
  deployProject,
  listProjects,
  initializeAdmin,
  uploadSchema,
  removeProject,
  tearDownAWS,
} from "./main.js";
import { program } from "commander";
import inquirer from "inquirer";

program
  .command("init")
  .description("Initialize your AWS with the necessary admin infrastructure")
  .option("-r, --region <region>", "Specify the AWS region")
  .action(async (options) => {
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
    };
    initializeAdmin(configs);
  });

program
  .command("deploy")
  .description("Deploy stack to ECS Fargate")
  .option("-n, --name <name>", "Specify the project name")
  .option("-r, --region <region>", "Specify the AWS region")
  .action(async (options) => {
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
      region:
        options.region ||
        (
          await inquirer.prompt({
            type: "input",
            name: "region",
            message: "Specify the AWS region",
          })
        ).region,
    };
    deployProject(configs);
  });

program
  .command("import")
  .description("Import a schema file to a backend")
  .option("-n, --name <name>", "Specify the project name")
  .option("-f, --filePath <filePath>", "Specify the path to the schema file")
  .action(async (options) => {
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
      filePath:
        options.filePath ||
        (
          await inquirer.prompt({
            type: "input",
            name: "filePath",
            message: "Specify the path to the schema file",
          })
        ).filePath,
    };

    uploadSchema(configs.filePath, configs.name);
  });
program
  .command("list")
  .description("List all active projects")
  .action(async () => {
    listProjects();
  });

program
  .command("remove")
  .description("Remove a project")
  .option("-n, --name <name>", "Specify the project name")
  .action(async (options) => {
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
    removeProject(configs);
  });

program
  .command("melt")
  .description("Remove admin infrastructure from AWS")
  .action(async () => {
    tearDownAWS();
  });

program.parse(process.argv);

export async function cli() {}
