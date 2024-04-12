import {
  removeAdmin,
} from "../main.js";
import { program } from "commander";
import inquirer from "inquirer";
import ora from "ora";
import { createSpinner } from "../utils/ui.js"
import chalk from "chalk";

export async function melt(options) {
  console.log(
    chalk.red("Warning: This action is irreversible and will remove the snowclone admin infrastructure from AWS")
  );

  const answer = await inquirer.prompt([
    {
      type: "input",
      name: "confirmation",
      message: 'To proceed, type "yes":',
    },
  ]);
  if (answer.confirmation.toLowerCase() === "yes") {
    await removeAdmin();
  } else {
    console.log(chalk.red("Operation aborted."));
  }

  const spinner = createSpinner(
  "Removing from AWS..."
  );
  spinner.start();
  await removeAdmin();
  spinner.succeed("Your project has been removed!");
}