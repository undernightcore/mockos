import chalk from "chalk";

export const logHttp = (status: number, message: string) => {
  const print =
    status > 0 && status < 400
      ? chalk.bgGreen
      : status >= 400 && status < 500
      ? chalk.bgHex("#FFA500")
      : chalk.bgRed;

  console.log(`${print(` ${status} `)} ${message}`);
};
