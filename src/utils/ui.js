import chalk from "chalk";

export const red = chalk.bold.red;
export const dim = chalk.gray;
export const green = chalk.bold.hex("#1cffc9");
export const purple = chalk.bold.hex("#5e17eb");
export const orange = chalk.bold.hex("#ff8a00");
export const pink = chalk.bold.hex("#f800c2");

export function success(text) {
  console.log(`\n🍦 ${green(text)}`);
}

export function waiting(text) {
  console.log(`\n🍦 ${purple(text)}\n`);
}

export function warning(text) {
  console.log(red(text));
}
export const asciiBanner = " \n\n \
_/_/_/     _/      _/    _/_/    _/          _/    _/_/_/  _/          _/_/    _/      _/  _/_/_/_/  \n \
_/        _/_/    _/  _/    _/  _/          _/  _/        _/        _/    _/  _/_/    _/  _/         \n \
 _/_/    _/  _/  _/  _/    _/  _/    _/    _/  _/        _/        _/    _/  _/  _/  _/  _/_/_/      \n \
    _/  _/    _/_/  _/    _/    _/  _/  _/    _/        _/        _/    _/  _/    _/_/  _/           \n \
_/_/   _/      _/    _/_/        _/  _/        _/_/_/  _/_/_/_/    _/_/    _/      _/  _/_/_/_/      \n\n"