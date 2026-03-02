import { Request } from "express";
import { HttpError } from "../errors/http";
import { prisma } from "../services/prisma";
import { TokenTypeEnum } from "../types/token";
import { validateToken } from "./jwt";

export const authenticateUser = async (request: Request) => {
  const token = request.headers.authorization?.split(" ")[1];
  if (!token) throw new HttpError(401, "User not authenticated");

  const validated = validateToken(token);
  if (validated?.type !== TokenTypeEnum.AUTH)
    throw new HttpError(401, "User not authenticated");

  const user = await prisma.user.findUnique({
    where: { id: validated.userId },
  });
  if (!user || !user.verified)
    throw new HttpError(401, "User not authenticated");

  return user;
};
