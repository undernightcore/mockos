import { RequestHandler } from "express";
import { v4 } from "uuid";
import { HttpError } from "../errors/http";
import { authenticateUser } from "../helpers/auth";
import { prisma } from "../services/prisma";
import {
  sendMessageToChannel,
  subscribeToChannel,
  unsubscribeFromChannel,
} from "../services/redis";
import { removeFile, uploadFile } from "../services/s3";
import { createResponseValidator } from "../validators/responses/create";
import { editResponseValidator } from "../validators/responses/edit";

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
    ...(req.file
      ? { body: new File([req.file.buffer], req.file.originalname) }
      : {}),
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

  const existing = await prisma.response.findFirst({
    where: { routeId: route.id, name: data.name },
  });
  if (existing)
    throw new HttpError(409, "A response with that name already exists");

  const created = await prisma.$transaction(async (tx) => {
    const fileName =
      data.body instanceof File
        ? `projects/${project.id}/route/${route.id}/responses/${v4()}/${
            data.body.name
          }`
        : "";

    const response = await tx.response.create({
      data: {
        ...data,
        routeId: route.id,
        file: data.body instanceof File,
        body: data.body instanceof File ? fileName : data.body,
      },
    });

    if (data.body instanceof File) {
      await uploadFile(fileName, data.body);
    }

    return response;
  });

  res.status(200).json(created);

  // Send to realtime
  prisma.response
    .findMany({
      where: { routeId: route.id },
    })
    .then((responses) =>
      sendMessageToChannel(`route:${route.id}`, JSON.stringify(responses))
    )
    .catch();
};

export const editResponse: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);
  const data = editResponseValidator.parse({
    ...req.body,
    ...(req.file
      ? { body: new File([req.file.buffer], req.file.originalname) }
      : {}),
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
    throw new HttpError(403, "You are not allowed to edit responses");

  const route = await prisma.route.findUnique({
    where: {
      id: Number(req.params.routeId),
      projectId: project.id,
    },
  });
  if (!route) throw new HttpError(404, "Route not found");

  const conflicting = await prisma.response.findFirst({
    where: {
      routeId: route.id,
      name: data.name,
      id: { not: Number(req.params.responseId) },
    },
  });
  if (conflicting)
    throw new HttpError(409, "A response with that name already exists");

  const existing = await prisma.response.findUnique({
    where: { routeId: route.id, id: Number(req.params.responseId) },
  });
  if (!existing) throw new HttpError(404, "Response not found");

  const edited = await prisma.$transaction(async (tx) => {
    const fileName =
      data.body instanceof File
        ? `projects/${project.id}/route/${route.id}/responses/${v4()}/${
            data.body.name
          }`
        : "";

    const response = await tx.response.update({
      where: { id: existing.id },
      data: {
        ...data,
        file: data.body ? data.body instanceof File : undefined,
        body: data.body
          ? data.body instanceof File
            ? fileName
            : data.body
          : undefined,
      },
    });

    if (data.body instanceof File) {
      await uploadFile(fileName, data.body);
    }

    return response;
  });

  if (existing.file && data.body instanceof File) {
    await removeFile(existing.body).catch();
  }

  res.status(200).json(edited);

  // Send to realtime
  prisma.response
    .findMany({
      where: { routeId: route.id },
    })
    .then((responses) =>
      sendMessageToChannel(`route:${route.id}`, JSON.stringify(responses))
    )
    .catch();
};
