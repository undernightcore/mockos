import { RequestHandler } from "express";
import { HttpError } from "../errors/http";
import { authenticateUser } from "../helpers/auth";
import { generateRandomToken } from "../helpers/crypto";
import { prisma } from "../services/prisma";
import { filterValidator } from "../validators/shared/filter";
import { paginationValidator } from "../validators/shared/pagination";
import { createTokenValidator } from "../validators/tokens/create";

export const listTokens: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);

  const { page, pageSize } = paginationValidator.parse(req.query);
  const { search, orderBy, direction } = filterValidator.parse(req.query);

  const project = await prisma.project.findUnique({
    include: { members: true },
    where: {
      id: Number(req.params.projectId),
      members: { some: { userId: user.id, verified: true } },
    },
  });
  if (!project) throw new HttpError(404, "Project not found");

  const admin = project.members.some(
    (member) => member.userId === user.id && member.role === "ADMIN"
  );
  if (!admin) throw new HttpError(403, "Only the admin can list tokens");

  const [tokens, total] = await prisma.$transaction([
    prisma.token.findMany({
      where: {
        projectId: project.id,
        name: { mode: "insensitive", contains: search },
      },
      orderBy: orderBy ? { [orderBy]: direction } : undefined,
      skip: page * pageSize,
      take: pageSize,
    }),
    prisma.token.count({
      where: {
        projectId: project.id,
        name: { mode: "insensitive", contains: search },
      },
    }),
  ]);

  return res.status(200).json({
    tokens,
    total,
  });
};

export const createToken: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);
  const { name } = createTokenValidator.parse(req.body);

  const project = await prisma.project.findUnique({
    include: { members: true },
    where: {
      id: Number(req.params.projectId),
      members: { some: { userId: user.id, verified: true } },
    },
  });
  if (!project) throw new HttpError(404, "Project not found");

  const admin = project.members.some(
    (member) => member.userId === user.id && member.role === "ADMIN"
  );
  if (!admin) throw new HttpError(403, "Only the admin can create tokens");

  const existing = await prisma.token.findFirst({
    where: { name, projectId: project.id },
  });
  if (existing)
    throw new HttpError(409, "A token with that name already exists");

  const created = await prisma.token.create({
    data: { token: generateRandomToken(40), name, projectId: project.id },
  });

  return res.status(200).json(created);
};

export const deleteToken: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);

  const project = await prisma.project.findUnique({
    include: { members: true },
    where: {
      id: Number(req.params.projectId),
      members: { some: { userId: user.id, verified: true } },
    },
  });
  if (!project) throw new HttpError(404, "Project not found");

  const admin = project.members.some(
    (member) => member.userId === user.id && member.role === "ADMIN"
  );
  if (!admin) throw new HttpError(403, "Only the admin can delete tokens");

  const existing = await prisma.token.findUnique({
    where: { id: Number(req.params.tokenId) },
  });
  if (!existing) throw new HttpError(404, "Token not found");

  await prisma.token.delete({
    where: { id: existing.id },
  });

  return res.status(200).json({ message: "Token deleted successfully" });
};
