import { createProject, deployProject, removeProject } from "./main.js";
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
  .command("test")
  .action(async () => {
    const answer = await inquirer.prompt({
      type: "input",
      name: "answer",
      message: "enter something",
    })
    console.log(answer.answer);
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
    console.log("configurations: ", configurations);
    deployProject(configurations);
  })

program
  .command("remove")
  .description("Remove a project from ECS Fargate")
  .action(async () => {
    const projectName = await inquirer.prompt({
      type: "input",
      name: "name",
      message: "Specify the name of the project you would like to remove"
    })
    removeProject(projectName)
  })

program.parse(process.argv);

export async function cli() {}
