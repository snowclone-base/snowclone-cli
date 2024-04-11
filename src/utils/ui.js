import ora from "ora";
const spinnerColor = "cyan";

export const createSpinner = (text) => {
  return ora({
    text,
    color: spinnerColor,
  });
};