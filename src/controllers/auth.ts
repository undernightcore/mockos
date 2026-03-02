import { RequestHandler } from "express";
import { HttpError } from "../errors/http";
import { hashPassword } from "../helpers/bcrypt";
import { prisma } from "../services/prisma";
import { registerValidator } from "../validators/auth/register";

export const registerUser: RequestHandler = async (req, res) => {
  const data = registerValidator.parse(req.body);

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing)
    throw new HttpError(400, "A user with that email already exists");

  await prisma.user.create({
    data: {
      ...data,
      password: await hashPassword(data.password),
      verified: false,
    },
  });

  return res
    .status(200)
    .json({ message: "Please check your inbox and verify your account!" });
};
