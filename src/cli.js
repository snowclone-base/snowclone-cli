import arg from "arg";
import { createProject } from "./main";

// relay-cli --name my-project-name
function parseArgumentsIntoOptions(rawArgs) {
  const args = arg(
    {
      "--name": String,

      // Aliases
      "-n": "--name",
    },
    {
      argv: rawArgs.slice(2),
    }
  );

  return {
    name: args["--name"] || false,
  };
}

export async function cli(args) {
  let options = parseArgumentsIntoOptions(args);
  await createProject(options);
}
