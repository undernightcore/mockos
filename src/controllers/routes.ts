import { RequestHandler } from "express";
import { HttpError } from "../errors/http";
import { authenticateUser } from "../helpers/auth";
import { prisma } from "../services/prisma";

export const getRoutes: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);

  const project = await prisma.project.findUnique({
    include: { members: true },
    where: {
      id: Number(req.params.projectId),
      members: { some: { userId: user.id, verified: true } },
    },
  });
  if (!project) throw new HttpError(404, "Project not found");
};
