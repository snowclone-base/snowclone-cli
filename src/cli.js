import { createProject } from "./main";
import { program } from "commander";

program
  .command("new")
  .description("Create a new project")
  .option("-n, --name <name>", "Name of the project")
  .action(async (options) => {
    await createProject(options);
  });

program.parse(process.argv);

export async function cli() {}
