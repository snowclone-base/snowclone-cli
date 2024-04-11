import { listProjects } from "../main.js";
import { createSpinner } from "../utils/ui.js"
import chalk from "chalk";

export async function list(options) {
  const spinner = createSpinner(
    "Fetching projects..."
  );
  spinner.start();
  const projects = await listProjects();
  spinner.stop();
  if (projects.length === 0) {
    console.log(chalk.green("You have no active projects!"));
  } else {
    console.log(chalk.blueBright("Active projects: "));
    projects.forEach(project => {
      console.log(chalk.green(project));
    })
  }
}