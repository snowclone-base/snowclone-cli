import ora from "ora";
import chalk from "chalk";

export const red = chalk.red;
export const dim = chalk.gray;
export const green = chalk.green;

export const createSpinner = (text) => {
  return ora({
    text,
    color: spinnerColor,
  });
};