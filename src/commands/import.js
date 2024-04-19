import { uploadSchema } from "../utils/processes.js";
import { getInfoForProjects } from "../utils/localFileHelpers.js";
import { getProjectFromDynamo } from "../utils/awsHelpers.js";
import * as ui from "../utils/ui.js";
import inquirer from "inquirer";

export async function importSchema(options) {
  const configs = {
    name:
      options.name ||
      (
        await inquirer.prompt({
          type: "input",
          name: "name",
          message: "Specify the project name:",
        })
      ).name,
    filePath:
      options.filePath ||
      (
        await inquirer.prompt({
          type: "input",
          name: "filePath",
          message: "Specify the path to the schema file:",
        })
      ).filePath,
  };

  const { region } = getInfoForProjects();
  const projectInfo = await getProjectFromDynamo(configs.name, region);
  const statusCode = await uploadSchema(configs.filePath, projectInfo.endpoint, projectInfo.apiToken);
  console.log("code: ", statusCode)
  if (Number(statusCode) === 201) {
    ui.success("Your schema file has been imported successfully!");
  } else {
    ui.warning("There was an error uploading your schema file. Please check your file path.")
  }
  
}