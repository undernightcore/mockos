import { RequestHandler } from "express";
import { HttpError } from "../errors/http";
import { authenticateUser } from "../helpers/auth";
import { prisma } from "../services/prisma";
import { subscribeToChannel, unsubscribeFromChannel } from "../services/redis";

export const getRoutes: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);

  const project = await prisma.project.findUnique({
    where: {
      id: Number(req.params.projectId),
      members: { some: { userId: user.id, verified: true } },
    },
  });
  if (!project) throw new HttpError(404, "Project not found");

  const routes = await prisma.route.findMany({
    include: { children: { orderBy: { order: "asc" } } },
    where: { projectId: project.id, parentFolderId: null },
    orderBy: { order: "asc" },
  });

  res.status(200).json(routes);
};

export const getRoutesRealtime: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);

  const project = await prisma.project.findUnique({
    where: {
      id: Number(req.params.projectId),
      members: { some: { userId: user.id, verified: true } },
    },
  });
  if (!project) throw new HttpError(404, "Project not found");

  const routes = await prisma.route.findMany({
    include: { children: { orderBy: { order: "asc" } } },
    where: { projectId: project.id, parentFolderId: null },
    orderBy: { order: "asc" },
  });

  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write(`data: ${JSON.stringify(routes)}\n\n`);

  const listener = (message: string) => {
    res.write(`data: ${message}\n\n`);
  };

  res.on("close", () => {
    unsubscribeFromChannel(`project:${project.id}`, listener);
  });

  await subscribeToChannel(`project:${project.id}`, listener);
};

export const createRoute: RequestHandler = async (req, res) => {
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
    (member) =>
      member.userId === user.id &&
      (member.role === "ADMIN" || member.role === "EDITOR")
  );
  if (!admin) throw new HttpError(403, "You are not allowed to create routes");
};
