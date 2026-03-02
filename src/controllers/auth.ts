import { RequestHandler } from "express";
import { HttpError } from "../errors/http";
import { hashPassword, isValidPassword } from "../helpers/bcrypt";
import { createToken, validateToken } from "../helpers/jwt";
import { sendConfirmationEmail, sendResetEmail } from "../services/email";
import { prisma } from "../services/prisma";
import { TokenTypeEnum } from "../types/token";
import { loginValidator } from "../validators/auth/login";
import { registerValidator } from "../validators/auth/register";
import { requestResetValidator } from "../validators/auth/request-reset";
import { resetValidator } from "../validators/auth/reset";
import { verifyValidator } from "../validators/auth/verify";

export const registerUser: RequestHandler = async (req, res) => {
  const data = registerValidator.parse(req.body);

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing)
    throw new HttpError(400, "A user with that email already exists");

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        ...data,
        password: await hashPassword(data.password),
        verified: false,
      },
    });

    await sendConfirmationEmail(
      user.name,
      user.email,
      encodeURI(
        `${process.env.UI_URL}/verify/${createToken(
          user.id,
          TokenTypeEnum.EMAIL
        )}`
      )
    );
  });

  return res
    .status(200)
    .json({ message: "Please check your inbox and verify your account!" });
};

export const loginUser: RequestHandler = async (req, res) => {
  const data = loginValidator.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (user && !user.password) {
    await sendResetEmail(
      user.name,
      user.email,
      encodeURI(
        `${process.env.UI_URL}/reset/${createToken(
          user.id,
          TokenTypeEnum.RESET,
          24 * 3600
        )}`
      )
    );
    throw new HttpError(
      400,
      "We have migrated your account. We have sent you a reset password link to your email."
    );
  }

  const valid = await isValidPassword(
    data.password,
    user?.password ??
      "$2a$10$bkRIA9a25kwbAiTwkuUtXeXJiMZXoQs7/T1oMNS4oazScc8s0rrOu"
  );
  if (!user || !valid)
    throw new HttpError(
      401,
      "A user with those credentials has not been found"
    );

  if (!user.verified)
    throw new HttpError(403, "You have to verify your email first");

  return res
    .status(200)
    .json({ token: createToken(user.id, TokenTypeEnum.AUTH) });
};

export const requestVerifyUser: RequestHandler = async (req, res) => {
  const { email } = requestResetValidator.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    return res.status(200).json({
      message: "A verification link has been sent to that email",
    });

  await sendConfirmationEmail(
    user.name,
    user.email,
    encodeURI(
      `${process.env.UI_URL}/verify/${createToken(
        user.id,
        TokenTypeEnum.EMAIL
      )}`
    )
  );

  return res.status(200).json({
    message: "A verification link has been sent to that email",
  });
};

export const verifyUser: RequestHandler = async (req, res) => {
  const { token } = verifyValidator.parse(req.body);

  const validated = validateToken(token);
  if (validated?.type !== TokenTypeEnum.EMAIL)
    throw new HttpError(403, "Verification has failed.");

  await prisma.user.update({
    where: { id: validated.userId },
    data: { verified: true },
  });

  return res
    .status(200)
    .json({ token: createToken(validated.userId, TokenTypeEnum.AUTH) });
};

export const requestResetUser: RequestHandler = async (req, res) => {
  const { email } = requestResetValidator.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    return res.status(200).json({
      message: "A reset password link has been sent to that email",
    });

  await sendResetEmail(
    user.name,
    user.email,
    encodeURI(
      `${process.env.UI_URL}/reset/${createToken(
        user.id,
        TokenTypeEnum.RESET,
        24 * 3600
      )}`
    )
  );

  return res.status(200).json({
    message: "A reset password link has been sent to that email",
  });
};

export const resetUser: RequestHandler = async (req, res) => {
  const { token, password } = resetValidator.parse(req.body);

  const validated = validateToken(token);
  if (validated?.type !== TokenTypeEnum.RESET)
    throw new HttpError(403, "Reset has failed.");

  await prisma.user.update({
    where: { id: validated.userId },
    data: { password: await hashPassword(password) },
  });

  return res
    .status(200)
    .json({ token: createToken(validated.userId, TokenTypeEnum.AUTH) });
};
