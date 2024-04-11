import {
  deployProject,
  listProjects,
  initializeAdmin,
  uploadSchema,
  removeProject,
  removeProjects,
  removeAdmin
} from "../main.js";
import { program } from "commander";
import inquirer from "inquirer";
import ora from "ora";
import { createSpinner } from "../utils/ui.js"

const COLORS = ["red", "green", "blue", "yellow", "magenta", "cyan", "white", "gray"];
let randomIndex = Math.floor(Math.random() * COLORS.length);

export async function init(options) {
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
  const spinner = createSpinner(
    "Deploying to AWS... This may take up to 15 minutes!"
  );
  
  spinner.start();
  await initializeAdmin(configs)
  spinner.succeed("Successfully deployed! You are ready to deploy projects.");
}
