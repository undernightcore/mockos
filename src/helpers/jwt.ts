import pkg from "jsonwebtoken";
import { TokenTypeEnum } from "../types/token";
const { sign, verify } = pkg;

export function createToken(
  userId: number,
  type: TokenTypeEnum,
  expiresIn?: number
) {
  if (!process.env.APP_SECRET) {
    throw new Error("There is no APP_SECRET environment variable present");
  }

  return sign(
    { userId, type },
    process.env.APP_SECRET,
    expiresIn ? { expiresIn } : undefined
  );
}

export function validateToken(token: string) {
  if (!process.env.APP_SECRET) {
    throw new Error("There is no APP_SECRET environment variable present");
  }

  try {
    return verify(token, process.env.APP_SECRET) as {
      userId: number;
      type: TokenTypeEnum;
    };
  } catch {
    return undefined;
  }
}
