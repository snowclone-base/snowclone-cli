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
    initializeAdmin(configs);
  });

program
  .command("deploy")
  .description("Deploy stack to ECS Fargate")
  .option("-n, --name <name>", "Specify the project name")
  .option("-r, --region <region>", "Specify the AWS region")
  .option("-d, --domain <domain>", "Specify the project's domain name")
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
      domain:
        options.domain ||
        (
          await inquirer.prompt({
            type: "input",
            name: "domain",
            message: "Specify the project's domain name",
          })
        ).domain,
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
    console.log(
      "Warning: This action is irreversible and will destroy all backends and remove the snowclone admin infrastructure from AWS"
    );

    const answer = await inquirer.prompt([
      {
        type: "input",
        name: "confirmation",
        message: 'To proceed, type "yes":',
      },
    ]);
    if (answer.confirmation.toLowerCase() === "yes") {
      tearDownAWS();
    } else {
      console.log("Operation aborted.");
    }
  });

program.parse(process.argv);

export async function cli() {}