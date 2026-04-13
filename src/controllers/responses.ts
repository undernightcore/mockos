import { RequestHandler } from "express";
import { HttpError } from "../errors/http";
import { authenticateUser } from "../helpers/auth";
import { prisma } from "../services/prisma";
import { subscribeToChannel, unsubscribeFromChannel } from "../services/redis";
import { createResponseValidator } from "../validators/responses/create";

export const getResponses: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);

  const project = await prisma.project.findUnique({
    where: {
      id: Number(req.params.projectId),
      members: { some: { userId: user.id, verified: true } },
    },
  });
  if (!project) throw new HttpError(404, "Project not found");

  const route = await prisma.route.findUnique({
    where: {
      id: Number(req.params.routeId),
      projectId: project.id,
    },
  });
  if (!route) throw new HttpError(404, "Route not found");

  const responses = await prisma.response.findMany({
    where: { routeId: route.id },
  });

  res.status(200).json(responses);
};

export const getResponsesRealtime: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);

  const project = await prisma.project.findUnique({
    where: {
      id: Number(req.params.projectId),
      members: { some: { userId: user.id, verified: true } },
    },
  });
  if (!project) throw new HttpError(404, "Project not found");

  const route = await prisma.route.findUnique({
    where: {
      id: Number(req.params.routeId),
      projectId: project.id,
    },
  });
  if (!route) throw new HttpError(404, "Route not found");

  const responses = await prisma.response.findMany({
    where: { routeId: route.id },
  });

  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write(`data: ${JSON.stringify(responses)}\n\n`);

  const listener = (message: string) => {
    res.write(`data: ${message}\n\n`);
  };

  res.on("close", () => {
    unsubscribeFromChannel(`route:${route.id}`, listener);
  });

  await subscribeToChannel(`route:${route.id}`, listener);
};

export const createResponse: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);
  const data = createResponseValidator.parse({
    ...req.body,
    body: req.file
      ? new File([req.file.buffer], req.file.originalname)
      : undefined,
  });

  const project = await prisma.project.findUnique({
    include: { members: true },
    where: {
      id: Number(req.params.projectId),
      members: { some: { userId: user.id, verified: true } },
    },
  });
  if (!project) throw new HttpError(404, "Project not found");

  const editor = project.members.some(
    (member) =>
      member.userId === user.id &&
      (member.role === "ADMIN" || member.role === "EDITOR")
  );
  if (!editor)
    throw new HttpError(403, "You are not allowed to create responses");

  const route = await prisma.route.findUnique({
    where: {
      id: Number(req.params.routeId),
      projectId: project.id,
    },
  });
  if (!route) throw new HttpError(404, "Route not found");

  const existing = await prisma.response.findMany({
    where: { routeId: route.id, name: data.name },
  });
  if (existing)
    throw new HttpError(409, "A response with that name already exists");

  res.status(200).json(created);

  // Send to realtime
  prisma.route
    .findMany({
      include: { children: { orderBy: { order: "asc" } } },
      where: { projectId: project.id, parentFolderId: null },
      orderBy: { order: "asc" },
    })
    .then((routes) =>
      sendMessageToChannel(`project:${project.id}`, JSON.stringify(routes))
    )
    .catch();
};
