import {
  deployProject,
} from "../main.js";
import inquirer from "inquirer";
import { createSpinner } from "../utils/ui.js"

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
  const spinner = createSpinner(
    "Deploying to AWS... This could take several minutes!"
  );
  spinner.start();

  await deployProject(configs);
  spinner.succeed("Your project has been successfully deployed to AWS!")
}