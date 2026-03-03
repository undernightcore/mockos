import chalk from "chalk";

export const logHttp = (
  status: number,
  method: string,
  url: string,
  message: string
) => {
  const print =
    status > 0 && status < 400
      ? chalk.bgGreen
      : status >= 400 && status < 500
      ? chalk.bgHex("#FFA500")
      : chalk.bgRed;

  console.log(
    `${print(` ${status} `)}${chalk.bold.bgBlue(
      ` ${method} `
    )}${chalk.bold.bgWhite(` ${url} `)} ${message}`
  );
};
