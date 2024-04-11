import { removeProjects } from "../main.js";
import inquirer from "inquirer";
import { createSpinner } from "../utils/ui.js"
import chalk from "chalk";

export async function destroy() {
  console.log(
    chalk.red("Warning: This action is irreversible and will destroy all backends")
  );
  
  const answer = await inquirer.prompt([
    {
      type: "input",
      name: "confirmation",
      message: 'To proceed, type "yes":',
    },
  ]);

  if (answer.confirmation.toLowerCase() === "yes") {
    const spinner = createSpinner(
      "Removing admin infrastructure. This could take several minutes."
    );
    spinner.start();
    await removeProjects();
    spinner.succeed("Successfully removed all projects!")
  } else {
    console.log(chalk.red("Operation aborted."));
  }
}


