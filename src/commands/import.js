import { uploadSchema } from "../main.js";
import inquirer from "inquirer";
import { createSpinner } from "../utils/ui.js"

export async function importSchema(options) {
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
    filePath:
      options.filePath ||
      (
        await inquirer.prompt({
          type: "input",
          name: "filePath",
          message: "Specify the path to the schema file",
        })
      ).filePath,
  };
  const spinner = createSpinner(
    "Importing schema file to postgres..."
  );
  spinner.start();
  await uploadSchema(configs.filePath, configs.name);
  spinner.succeed("Schema imported successfully!");
}