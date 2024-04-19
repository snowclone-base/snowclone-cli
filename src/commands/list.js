import { getAllProjects } from "../utils/awsHelpers.js";
import chalk from "chalk";
import * as ui from "../utils/ui.js";
import { exec } from "child_process";

export async function list() {
  const projects = await getAllProjects();
  
  if (projects.length === 0) {
    console.log(chalk.green("You have no active projects!"));
  } else {
    console.log(chalk.blueBright("🍦 Active projects: 🍦\n"));
    projects.forEach((project, idx) => {
      console.log(` ${idx + 1}. `, ui.green(`${project.name}\n`));
    })
    exec("clear");
  }
}
