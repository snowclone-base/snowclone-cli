import {
  removeProject,
} from "../main.js";
import { program } from "commander";
import inquirer from "inquirer";
import ora from "ora";
import { createSpinner } from "../utils/ui.js"

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
  const spinner = createSpinner(
    "Removing project from AWS. This may take several minutes!"
  );
  spinner.start();
  await removeProject(configs);
  spinner.succeed("Your project has been removed!");
}