import { createProject, deployProject, listProjects, initializeAdmin, uploadSchema, removeProject, tearDownAWS } from "./main.js";
import { program } from "commander";
import inquirer from "inquirer";

program
  .command("new")
  .description("Create a new project")
  .option("-n, --name <name>", "Name of the project")
  .action(async (options) => {
    await createProject(options);
  });

program
  .command("init")
  .description("Initialize your AWS with the necessary admin infrastructure")
  .action(async () => {
    const configs = await inquirer.prompt({
      type: "input",
      name: "region",
      message: "Specify your desired AWS region",
    })
    initializeAdmin();
  })

program
  .command("deploy")
  .description("Deploy stack to ECS Fargate")
  .action(async () => {
    const prompts = [
      {
        type: "input",
        name: "name",
        message: "Specify the project name",
      },
      {
        type: "input",
        name: "region",
        message: "Specify the AWS region"
      }
    ]

    const configurations = await inquirer.prompt(prompts);
    deployProject(configurations);
  });

  program
    .command("import")
    .description("Import a schema file to a backend")
    .action(async () => {
      const prompts = [
        {
          type: "input",
          name: "name",
          message: "Specify the project name",
        },
        {
          type: "input",
          name: "filePath",
          message: "enter the path to the file you want to upload",
        },
      ]
      const configs = await inquirer.prompt(prompts)
      
      uploadSchema(configs.filePath, configs.name)
    })

program
    .command("list")
    .description("List all active projects")
    .action(async () => {
      listProjects();
    })

program
    .command("remove")
    .description("Remove a project")
    .action(async () => {
      const prompts = [
        {
          type: "input",
          name: "name",
          message: "Specify the project name",
        }
      ]
      const configs = await inquirer.prompt(prompts)
      
      removeProject(configs);
    })

  program
    .command("destroy")
    .description("Remove admin infrastructure from AWS")
    .action(async () => {
      tearDownAWS();
    })

program.parse(process.argv);

export async function cli() {}
