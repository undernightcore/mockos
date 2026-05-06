import { randomBytes } from "crypto";

export function generateRandomToken(size: number) {
  return randomBytes(size / 2).toString("hex");
}
