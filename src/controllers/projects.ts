import { RequestHandler } from "express";
import { authenticateUser } from "../helpers/auth";
import { prisma } from "../services/prisma";
import { filterValidator } from "../validators/shared/filter";
import { paginationValidator } from "../validators/shared/pagination";

export const listProjects: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);

  const { page, pageSize } = paginationValidator.parse(req.query);
  const { search, orderBy, direction } = filterValidator.parse(req.query);

  const [projects, total] = await prisma.$transaction([
    prisma.project.findMany({
      where: {
        members: { some: { userId: user.id, verified: true } },
        name: { mode: "insensitive", contains: search },
      },
      orderBy: orderBy ? { [orderBy]: direction } : undefined,
      skip: page * pageSize,
      take: pageSize,
    }),
    prisma.project.count({
      where: {
        members: { some: { userId: user.id, verified: true } },
        name: { mode: "insensitive", contains: search },
      },
    }),
  ]);

  return res.status(200).json({
    projects,
    total,
  });
};
