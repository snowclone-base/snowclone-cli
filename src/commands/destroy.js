import { removeProjects } from "../main.js";
import inquirer from "inquirer";
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
    
  } else {
    console.log(chalk.red("Operation aborted."));
  }
}


