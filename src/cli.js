import { program } from "commander";
import { init } from "./commands/init.js";
import { deploy } from "./commands/deploy.js";
import { list } from "./commands/list.js";
import { remove } from "./commands/remove.js";
import { melt } from "./commands/melt.js";
import { importSchema } from "./commands/import.js";

program
  .command("init")
  .description("Initialize your AWS with the necessary admin infrastructure")
  .option("-r, --region <region>", "Specify the AWS region")
  .action(async (options) => {
    init(options);
  })

program
  .command("deploy")
  .description("Deploy stack to ECS Fargate")
  .option("-n, --name <name>", "Specify the project name")
  .option("-r, --region <region>", "Specify the AWS region")
  .option("-d, --domain <domain>", "Specify the project's domain name")
  .action(async (options) => {
    deploy(options);
  });

program
  .command("import")
  .description("Import a schema file to a backend")
  .option("-n, --name <name>", "Specify the project name")
  .option("-f, --filePath <filePath>", "Specify the path to the schema file")
  .action(async (options) => {
    importSchema(options);
  });
program
  .command("list")
  .description("List all active projects")
  .action(async () => {
    list();
  });

program
  .command("remove")
  .description("Remove a project")
  .option("-n, --name <name>", "Specify the project name")
  .action(async (options) => {
    remove(options);
  });

  program
  .command("destroy")
  .description("Remove all backend projects from AWS")
  .action(async () => {
    destroy();
  });  

program
  .command("melt")
  .description("Remove admin infrastructure from AWS")
  .action(async () => {
    melt();
  });

program.parse(process.argv);

export async function cli() {}